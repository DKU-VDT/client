import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle, Activity, FileText } from 'lucide-react';

export const Report: React.FC = () => {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 relative pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-500" />
            AI 맞춤형 헬스케어 리포트
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">일주일간 축적된 자세 데이터를 AI가 분석한 결과입니다.</p>
        </div>

        {/* AI Analysis Summary Block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 p-[2px] rounded-3xl shadow-xl"
        >
          <div className="bg-white rounded-[22px] p-8 h-full">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">이번 주 자세 분석 종합 의견</h2>
                <p className="text-sm text-slate-500">생성형 AI 모델 분석</p>
              </div>
            </div>

            <div className="prose prose-slate max-w-none space-y-4 text-slate-700 font-medium">
              <p className="text-lg leading-relaxed font-bold text-slate-800">
                "이번 주 사용자님은 목요일 오후 3시경에 거북목 현상이 가장 심했고, 왼쪽 어깨가 처져 있습니다."
              </p>
              <p className="leading-relaxed">
                시계열 데이터를 분석한 결과, 주로 식사 후 소화가 이루어지는 14:00~15:00 시간대에 집중력이 떨어지며 목이 모니터 쪽으로 평균 22도 이상 치우치는 현상이 반복되었습니다. 또한, 키보드 타이핑 시 왼쪽 팔걸이 위치가 낮아 왼쪽 승모근에 과부하가 걸리고 있는 것으로 추정됩니다.
              </p>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" /> 주요 문제점
                </h4>
                <ul className="text-sm text-amber-700 space-y-2 list-disc pl-4">
                  <li>오후 2-3시 집중적 거북목 현상</li>
                  <li>왼쪽 어깨 쳐짐 (비대칭)</li>
                  <li>주간 경고 누적 14회 (지난주 대비 +2회)</li>
                </ul>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" /> 개선된 점
                </h4>
                <ul className="text-sm text-emerald-700 space-y-2 list-disc pl-4">
                  <li>오전 시간대 바른 자세 유지율 90% 달성</li>
                  <li>스트레칭 참여율 100% (화면 잠금 3회 모두 즉시 해제)</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Actionable Solutions */}
        <h3 className="text-2xl font-bold text-slate-800 mt-12 mb-6 tracking-tight">AI 맞춤형 솔루션</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SolutionCard 
            step="01"
            title="환경 세팅"
            desc="현재 모니터 높이가 눈높이보다 낮습니다. 모니터 받침대를 사용하여 모니터 높이를 3~5cm 정도 높여주세요."
            action="환경 점검 가이드 보기"
            delay={0.1}
          />
          <SolutionCard 
            step="02"
            title="맞춤형 1분 루틴"
            desc="왼쪽 어깨가 처진 것을 보완하기 위해 폼롤러를 활용한 왼쪽 승모근 이완 스트레칭을 하루 3번 1분간 진행하세요."
            action="스트레칭 영상 보기"
            delay={0.2}
          />
          <SolutionCard 
            step="03"
            title="알람 설정"
            desc="가장 자세가 무너지는 오후 2시 30분에 예방 차원의 5분 휴식 알람을 설정했습니다. 가벼운 산책을 권장합니다."
            action="알람 설정 확인"
            delay={0.3}
          />
        </div>
      </div>
    </div>
  );
};

const SolutionCard: React.FC<{ step: string; title: string; desc: string; action: string; delay: number }> = ({ step, title, desc, action, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow"
  >
    <div className="text-5xl font-black text-slate-100 mb-4">{step}</div>
    <h4 className="text-lg font-bold text-slate-800 mb-3">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed flex-1">{desc}</p>
    <button className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors">
      {action} <ArrowRight className="w-4 h-4" />
    </button>
  </motion.div>
);
