import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Monitor, 
  UserSquare, 
  Sun, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  ScanFace
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface CameraSetupWizardProps {
  onClose: () => void;
}

export const CameraSetupWizard: React.FC<CameraSetupWizardProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Handle Camera for Step 2
  useEffect(() => {
    if (step === 2) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraError(false);
        } catch (err) {
          setCameraError(true);
        }
      };
      startCamera();
    } else {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, [step]);

  // Simulate Scanning Progress in Step 2
  useEffect(() => {
    if (step === 2 && !cameraError) {
      setIsScanning(true);
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, cameraError]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">카메라 각도 세팅 마법사</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-100">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 flex-1 min-h-[400px] flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">정확한 분석을 위한 준비</h3>
                  <p className="text-slate-500">AI가 올바르게 자세를 인식할 수 있도록 카메라와 주변 환경을 점검해주세요.</p>
                </div>
                
                <div className="grid gap-4 mt-auto mb-auto">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm shrink-0">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">모니터 중앙 배치</h4>
                      <p className="text-sm text-slate-600">웹캠을 모니터의 상단 정중앙에 위치시켜주세요. 측면에 있으면 어깨 대칭 분석이 부정확해질 수 있습니다.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm shrink-0">
                      <UserSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">눈높이 맞춤</h4>
                      <p className="text-sm text-slate-600">카메라 렌즈가 사용자의 눈높이와 최대한 수평이 되도록 의자나 모니터 높이를 조절해주세요.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm shrink-0">
                      <Sun className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">충분한 조명</h4>
                      <p className="text-sm text-slate-600">얼굴에 짙은 그림자가 지지 않도록 실내 조명을 켜주세요. 역광은 피하는 것이 좋습니다.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col h-full"
              >
                <div className="text-center mb-4 shrink-0">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">화면 가이드라인 맞추기</h3>
                  <p className="text-sm text-slate-500">가이드라인 안에 얼굴과 어깨가 들어오도록 자세를 고쳐 앉아보세요.</p>
                </div>

                <div className="flex-1 relative bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-800 flex items-center justify-center">
                  {cameraError ? (
                    <div className="text-center text-slate-400 p-6">
                      <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">카메라를 찾을 수 없거나 권한이 없습니다.</p>
                      <p className="text-sm mt-1">브라우저의 카메라 접근 권한을 확인해주세요.</p>
                    </div>
                  ) : (
                    <>
                      <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                      />
                      
                      {/* Guide Overlay */}
                      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8">
                        <div className={`w-40 h-48 border-2 border-dashed rounded-full mb-8 transition-colors duration-500 ${isScanning ? 'border-amber-400' : 'border-emerald-400'}`}></div>
                        <div className={`w-3/4 h-1 border-t-2 border-dashed transition-colors duration-500 ${isScanning ? 'border-amber-400' : 'border-emerald-400'}`}></div>
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                          <ScanFace className={`w-4 h-4 ${isScanning ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <span className={`text-xs font-bold ${isScanning ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {isScanning ? '인식 중...' : '정렬 완료'}
                          </span>
                        </div>

                        {/* Scanner Line Effect */}
                        {isScanning && (
                          <motion.div 
                            animate={{ y: [0, 300, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute top-10 left-0 right-0 h-1 bg-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">세팅이 완료되었습니다!</h3>
                <p className="text-slate-500 mb-8 max-w-sm leading-relaxed">
                  이제 AI가 사용자님의 자세를 더 정확하게 모니터링할 수 있습니다. 
                  올바른 자세를 유지하며 건강한 습관을 만들어보세요.
                </p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full max-w-sm">
                  <h4 className="font-bold text-slate-700 text-sm mb-3">최종 점검 결과</h4>
                  <ul className="space-y-2 text-sm text-slate-600 text-left">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 카메라 각도 정상</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 얼굴 및 어깨 정렬 완료</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI 트래킹 엔진 활성화됨</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={handlePrev}
            className={`px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 ${step === 1 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" /> 이전으로
          </button>
          
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-sm"
          >
            {step === 3 ? '완료' : '다음 단계'}
            {step !== 3 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};