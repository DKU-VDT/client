import React from 'react';
import { usePosture } from '../context/PostureContext';

export const DebugPanel: React.FC = () => {
  const { warningsCount } = usePosture();

  return (
    <div className="fixed bottom-4 left-4 z-50 p-4 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-lg flex items-center justify-between gap-4 min-w-48">
      <h3 className="text-sm font-semibold text-slate-800">현재 경고 횟수</h3>
      <span className="text-sm font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-md">
        {warningsCount} / 3
      </span>
    </div>
  );
};
