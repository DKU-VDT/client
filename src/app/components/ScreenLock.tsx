import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePosture } from '../context/PostureContext';
import { CheckCircle, Camera, CameraOff, Loader2 } from 'lucide-react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// ─────────────────────────────────────────────────────────────
const STRETCHING_IMAGES = [
  '/stretching/stretch-1.png',
  '/stretching/stretch-2.png',
  '/stretching/stretch-3.png',
  '/stretching/stretch-4.png',
  '/stretching/stretch-5.png',
];

const HOLD_SECONDS = 5;
const SIMILARITY_THRESHOLD = 0.55;
const KEY_LANDMARKS = [11, 12, 13, 14, 15, 16, 23, 24];

type NormalizedLandmark = { x: number; y: number; z: number };

function normalizePose(lm: NormalizedLandmark[]) {
  const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
  const cx = (ls.x + rs.x) / 2, cy = (ls.y + rs.y) / 2;
  const scale = Math.abs(((lh.y + rh.y) / 2) - cy) || 0.3;
  return KEY_LANDMARKS.map(i => ({
    x: (lm[i].x - cx) / scale,
    y: (lm[i].y - cy) / scale,
  }));
}

function getSimilarity(ref: NormalizedLandmark[], cam: NormalizedLandmark[]): number {
  try {
    const rn = normalizePose(ref), cn = normalizePose(cam);
    const avg = rn.reduce((s, r, i) => s + Math.hypot(r.x - cn[i].x, r.y - cn[i].y), 0) / rn.length;
    return Math.max(0, Math.min(1, 1 - avg / 0.4));
  } catch { return 0; }
}

// ─────────────────────────────────────────────────────────────
export const ScreenLock: React.FC = () => {
  const { postureState, unlockScreen } = usePosture();

  // 랜덤 이미지: 잠금될 때마다 새로 뽑기
  const [stretchImg, setStretchImg] = useState(
    () => STRETCHING_IMAGES[Math.floor(Math.random() * STRETCHING_IMAGES.length)]
  );

  // MediaPipe
  const [mpReady, setMpReady] = useState(false);
  const refLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const camLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const refPoseRef = useRef<NormalizedLandmark[] | null>(null);
  const refImgElRef = useRef<HTMLImageElement | null>(null); // 이미지 엘리먼트 보관

  // 카메라
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // 단계: 'loading' → 'hold' → 'success'
  const [phase, setPhase] = useState<'loading' | 'hold' | 'success'>('loading');
  const [holdProgress, setHoldProgress] = useState(0);
  const [similarity, setSimilarity] = useState(0);
  const [refPoseDetected, setRefPoseDetected] = useState(false);
  const holdElapsedRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);

  // ── 잠금 발생 시 초기화 ──────────────────────────────────
  useEffect(() => {
    if (postureState === 'locked') {
      // 잠금될 때마다 새 이미지 랜덤 선택
      setStretchImg(STRETCHING_IMAGES[Math.floor(Math.random() * STRETCHING_IMAGES.length)]);
      setPhase('loading');
      setHoldProgress(0);
      setSimilarity(0);
      holdElapsedRef.current = 0;
      lastTimestampRef.current = null;
      refPoseRef.current = null;
      setRefPoseDetected(false);
      setCameraReady(false);
      setCameraError(false);
    }
  }, [postureState]);

  // ── MediaPipe 초기화 (앱 최초 1회) ──────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const opts = {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          },
          numPoses: 1,
        };
        const [ref, cam] = await Promise.all([
          PoseLandmarker.createFromOptions(vision, { ...opts, runningMode: 'IMAGE' }),
          PoseLandmarker.createFromOptions(vision, { ...opts, runningMode: 'VIDEO' }),
        ]);
        if (cancelled) return;
        refLandmarkerRef.current = ref;
        camLandmarkerRef.current = cam;
        setMpReady(true);
      } catch (e) {
        console.error('[MediaPipe]', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── 카메라 시작 ──────────────────────────────────────────
  useEffect(() => {
    if (postureState !== 'locked') return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCameraReady(true);
      })
      .catch(() => setCameraError(true));
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [postureState]);

  // ── 참고 이미지 포즈 추출 ────────────────────────────────
  const detectRefPose = useCallback((imgEl: HTMLImageElement) => {
    refImgElRef.current = imgEl; // 항상 저장 (MP 준비 전이어도)
    if (!refLandmarkerRef.current) return;
    try {
      const result = refLandmarkerRef.current.detect(imgEl);
      if (result.landmarks?.[0]) {
        refPoseRef.current = result.landmarks[0];
        setRefPoseDetected(true);
        console.log('[RefPose] 포즈 추출 성공');
      } else {
        setRefPoseDetected(false);
        console.warn('[RefPose] 사람 감지 안됨 - 이미지에서 사람을 찾지 못함');
      }
    } catch (e) {
      console.error('[RefPose]', e);
    }
  }, []);

  // ── MP가 뒤늦게 준비됐을 때 이미지 재시도 ─────────────
  useEffect(() => {
    if (mpReady && refImgElRef.current && !refPoseRef.current) {
      detectRefPose(refImgElRef.current);
    }
  }, [mpReady, detectRefPose]);

  // ── 메인 루프: 포즈 감지 + 일치할 때만 타이머 진행 ─────
  const runLoop = useCallback((timestamp: number) => {
    const video = videoRef.current;
    const landmarker = camLandmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(runLoop);
      return;
    }

    let sim = 0;
    try {
      const result = landmarker.detectForVideo(video, timestamp);
      if (result.landmarks?.[0] && refPoseRef.current) {
        sim = getSimilarity(refPoseRef.current, result.landmarks[0]);
      }
    } catch { /* 무시 */ }

    setSimilarity(sim);

    const dt = lastTimestampRef.current ? timestamp - lastTimestampRef.current : 16;

    if (sim >= SIMILARITY_THRESHOLD) {
      // 자세 일치 → 타이머 진행
      holdElapsedRef.current = Math.min(holdElapsedRef.current + dt, HOLD_SECONDS * 1000);
    } else {
      // 자세 불일치 → 타이머 감소
      holdElapsedRef.current = Math.max(0, holdElapsedRef.current - 30);
    }
    lastTimestampRef.current = timestamp;

    const progress = holdElapsedRef.current / (HOLD_SECONDS * 1000);
    setHoldProgress(progress);

    if (progress >= 1) {
      setPhase('success');
      setTimeout(unlockScreen, 1500);
      return;
    }

    rafRef.current = requestAnimationFrame(runLoop);
  }, [unlockScreen]);

  // ── 루프 시작/종료 ───────────────────────────────────────
  useEffect(() => {
    if (postureState !== 'locked' || phase !== 'hold' || !mpReady || !cameraReady) return;
    rafRef.current = requestAnimationFrame(runLoop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [postureState, phase, mpReady, cameraReady, runLoop]);

  // loading → hold 전환
  useEffect(() => {
    if (postureState === 'locked' && phase === 'loading' && mpReady && cameraReady) {
      setPhase('hold');
    }
  }, [postureState, phase, mpReady, cameraReady]);

  if (postureState !== 'locked') return null;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - holdProgress);
  const isMatching = similarity >= SIMILARITY_THRESHOLD;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">

        {/* ── 왼쪽: 참고 이미지 ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4"
        >
          <div className="text-center mb-2">
            <span className="inline-block bg-red-500/20 text-red-300 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30 mb-3">
              자세 불량 3회 누적 — 화면 잠금
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white">스트레칭을 따라해주세요</h1>
            <p className="text-white/50 mt-2 text-sm">
              아래 자세와 똑같이 따라하면 타이머가 시작됩니다.
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-900">
            <img
              src={stretchImg}
              alt="스트레칭 자세"
              className="w-full h-auto object-contain scale-x-[-1]"
              onLoad={e => detectRefPose(e.target as HTMLImageElement)}
              onError={e => {
                (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
                    <rect width="400" height="300" fill="#1e293b"/>
                    <text x="200" y="150" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">이미지를 불러올 수 없습니다</text>
                  </svg>`
                )}`;
              }}
            />
            <div className="absolute bottom-3 left-3 bg-black/60 text-white/70 text-xs px-2 py-1 rounded-lg font-medium">
              참고 자세
            </div>
            <div className={`absolute bottom-3 right-3 text-xs px-2 py-1 rounded-lg font-medium ${
              refPoseDetected ? 'bg-emerald-500/70 text-white' : 'bg-yellow-500/70 text-white'
            }`}>
              {refPoseDetected ? '포즈 감지됨 ✓' : '포즈 감지 중...'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/60 space-y-1.5">
            <p>① 위 사진과 같은 자세를 취해주세요.</p>
            <p>② 자세가 인식되면 타이머가 자동으로 시작됩니다.</p>
            <p>③ <span className="text-indigo-300 font-bold">{HOLD_SECONDS}초</span> 유지하면 잠금이 해제됩니다.</p>
          </div>
        </motion.div>

        {/* ── 오른쪽: 카메라 + 타이머 ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col items-center gap-5"
        >
          {/* 카메라 뷰 */}
          <div className={`relative w-full rounded-2xl overflow-hidden aspect-video bg-slate-900 transition-all duration-300 ${
            isMatching && phase === 'hold'
              ? 'border-2 border-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.35)]'
              : 'border-2 border-white/10'
          }`}>
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/40">
                <CameraOff className="w-10 h-10" />
                <p className="text-sm">카메라를 사용할 수 없습니다.</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay muted playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* 카메라 상태 */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-2.5 py-1.5 rounded-full text-xs text-white/70 font-medium">
                  <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                  <Camera className="w-3 h-3" /> 카메라
                </div>

                {/* 유사도 뱃지 */}
                {phase === 'hold' && (
                  <div className={`absolute top-3 right-3 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isMatching ? 'bg-emerald-500/80 text-white' : 'bg-black/60 text-white/50'
                  }`}>
                    {isMatching ? '✓ 자세 인식됨' : `유사도 ${Math.round(similarity * 100)}%`}
                  </div>
                )}

                {/* 로딩 오버레이 */}
                <AnimatePresence>
                  {phase === 'loading' && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3"
                    >
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <p className="text-white/60 text-sm">자세 인식 모델 로딩 중...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 성공 오버레이 */}
                <AnimatePresence>
                  {phase === 'success' && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/85"
                    >
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle className="w-20 h-20 text-emerald-400" />
                      </motion.div>
                      <p className="text-white font-black text-xl mt-3">스트레칭 완료!</p>
                      <p className="text-emerald-300 text-sm mt-1">잠금을 해제합니다...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* 원형 진행 타이머 */}
          <AnimatePresence>
            {phase === 'hold' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <svg width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="64" cy="64" r={radius} fill="none"
                    stroke={isMatching ? (holdProgress > 0.8 ? '#22c55e' : '#6366f1') : 'rgba(255,255,255,0.15)'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 64 64)"
                    style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
                  />
                  <text x="64" y="60" textAnchor="middle" fill="white" fontSize="26" fontWeight="900" fontFamily="sans-serif">
                    {Math.ceil(HOLD_SECONDS * (1 - holdProgress))}
                  </text>
                  <text x="64" y="80" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="sans-serif">
                    초 유지
                  </text>
                </svg>
                <p className={`text-sm font-medium transition-colors ${isMatching ? 'text-emerald-400' : 'text-white/40'}`}>
                  {isMatching ? '자세를 유지하세요!' : '자세를 맞춰주세요'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
};
