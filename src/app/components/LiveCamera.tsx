import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Focus,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { usePosture } from "../context/PostureContext";
import { createPortal } from "react-dom";

export const LiveCamera: React.FC = () => {
  const { postureState } = usePosture();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(
    null,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamObj, setStreamObj] =
    useState<MediaStream | null>(null);

  // Attempt to start the camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setStreamObj(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
      } catch (err) {
        setHasCamera(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update fullscreen video when toggled
  useEffect(() => {
    if (
      isFullscreen &&
      fullscreenVideoRef.current &&
      streamObj
    ) {
      fullscreenVideoRef.current.srcObject = streamObj;
    }
  }, [isFullscreen, streamObj]);

  const getStatusConfig = () => {
    switch (postureState) {
      case "danger":
        return {
          color: "text-red-500",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500",
          icon: <AlertTriangle className="w-5 h-5" />,
          label: "위험 (매우 나쁨)",
          angle: "28°",
          skeletonClass: "stroke-red-500",
        };
      case "warning":
        return {
          color: "text-amber-500",
          bgColor: "bg-amber-500/20",
          borderColor: "border-amber-500",
          icon: <ShieldAlert className="w-5 h-5" />,
          label: "주의 (자세 붕괴 감지)",
          angle: "18°",
          skeletonClass: "stroke-amber-500",
        };
      case "good":
      default:
        return {
          color: "text-emerald-500",
          bgColor: "bg-emerald-500/20",
          borderColor: "border-emerald-500",
          icon: <ShieldCheck className="w-5 h-5" />,
          label: "정상 (바른 자세)",
          angle: "10°",
          skeletonClass: "stroke-emerald-500",
        };
    }
  };

  const status = getStatusConfig();

  return (
    <>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col relative group">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
              <Focus className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">실시간 AI 자세 분석</span>
              <button
                onClick={() => setIsFullscreen(true)}
                className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                title="크게 보기"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>크게 보기</span>
              </button>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              카메라를 통해 현재 자세를 모니터링합니다.
            </p>
          </div>
        </div>

        <div className="relative flex-1 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-800 flex flex-col items-center justify-center h-full">
          {hasCamera === false ? (
            <div className="flex flex-col items-center text-slate-400 gap-3 z-10">
              <CameraOff className="w-10 h-10" />
              <p className="text-sm font-medium">
                카메라 권한이 없거나 찾을 수 없습니다.
              </p>
              <p className="text-xs">
                데모를 위해 가상 화면이 표시됩니다.
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          )}

          {/* AI Tracking Overlay (Simulated) */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className={`w-3/4 h-full fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round transition-colors duration-500 ${status.skeletonClass}`}
            >
              <rect
                x="35"
                y="10"
                width="30"
                height="35"
                className="stroke-[1] stroke-dashed opacity-50"
              />
              <circle cx="50" cy="25" r="8" />
              <line
                x1="50"
                y1="33"
                x2={
                  postureState === "good"
                    ? 50
                    : postureState === "warning"
                      ? 55
                      : 60
                }
                y2="45"
                className="transition-all duration-500"
              />
              <line
                x1={
                  postureState === "good"
                    ? 50
                    : postureState === "warning"
                      ? 55
                      : 60
                }
                y1="45"
                x2="50"
                y2="80"
                className="transition-all duration-500"
              />
              <line x1="30" y1="45" x2="70" y2="45" />
              <line x1="30" y1="45" x2="25" y2="70" />
              <line x1="70" y1="45" x2="75" y2="70" />
            </svg>
          </div>

          {/* Status Metrics Overlay */}
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-black/60 backdrop-blur-sm p-3 rounded-xl border border-white/10 text-white flex flex-col gap-1.5">
            <div className="flex justify-between items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bgColor} ${status.borderColor} ${status.color}`}
              >
                <span className="scale-75 origin-left">
                  {status.icon}
                </span>
                {status.label}
              </div>
            </div>
            <div className="flex justify-between items-center gap-4 text-[10px] font-medium text-white/70">
              <span>목 꺾임 각도</span>
              <span
                className={`font-bold ${status.color} text-xs`}
              >
                {status.angle}
              </span>
            </div>
          </div>

          {/* Live Indicator */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-bold text-white tracking-widest">
              LIVE AI
            </span>
          </div>
        </div>
      </div>

      {isFullscreen &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col items-center justify-center">
              {/* Fullscreen Video */}
              {hasCamera === false ? (
                <div className="flex flex-col items-center text-slate-400 gap-4 z-10">
                  <CameraOff className="w-16 h-16" />
                  <p className="text-xl font-medium">
                    카메라 권한이 없거나 찾을 수 없습니다.
                  </p>
                  <p className="text-sm">
                    데모를 위해 가상 화면이 표시됩니다.
                  </p>
                </div>
              ) : (
                <video
                  ref={fullscreenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* AI Tracking Overlay Fullscreen */}
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className={`w-1/2 h-full fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round transition-colors duration-500 ${status.skeletonClass}`}
                >
                  <rect
                    x="35"
                    y="10"
                    width="30"
                    height="35"
                    className="stroke-[1] stroke-dashed opacity-50"
                  />
                  <circle cx="50" cy="25" r="8" />
                  <line
                    x1="50"
                    y1="33"
                    x2={
                      postureState === "good"
                        ? 50
                        : postureState === "warning"
                          ? 55
                          : 60
                    }
                    y2="45"
                    className="transition-all duration-500"
                  />
                  <line
                    x1={
                      postureState === "good"
                        ? 50
                        : postureState === "warning"
                          ? 55
                          : 60
                    }
                    y1="45"
                    x2="50"
                    y2="80"
                    className="transition-all duration-500"
                  />
                  <line x1="30" y1="45" x2="70" y2="45" />
                  <line x1="30" y1="45" x2="25" y2="70" />
                  <line x1="70" y1="45" x2="75" y2="70" />
                </svg>
              </div>

              {/* Header / Controls Overlay */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-bold text-white tracking-widest">
                      LIVE AI TRACKING
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold border bg-black/50 backdrop-blur-md ${status.borderColor} ${status.color}`}
                  >
                    {status.icon}
                    {status.label}
                  </div>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Metrics Overlay Bottom */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 text-white flex items-center gap-12">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-medium text-white/70">
                    목 꺾임 각도
                  </span>
                  <span
                    className={`text-3xl font-black ${status.color}`}
                  >
                    {status.angle}
                  </span>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-medium text-white/70">
                    어깨 대칭도
                  </span>
                  <span className="text-3xl font-black text-emerald-400">
                    98%
                  </span>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-medium text-white/70">
                    추정 위험도
                  </span>
                  <span
                    className={`text-3xl font-black ${status.color}`}
                  >
                    {postureState === "good"
                      ? "낮음"
                      : postureState === "warning"
                        ? "주의"
                        : "위험"}
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};