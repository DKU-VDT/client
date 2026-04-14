import React, { createContext, useContext, useState, useEffect } from 'react';

type PostureState = 'good' | 'warning' | 'danger' | 'locked';

export interface PostureBaseline {
  shoulderCenterY: number;  // normalized 0-1 (어깨 중심 높이)
  headDeviation: number;    // nose.y - shoulderCenterY (거북목 편차)
  shoulderTilt: number;     // |left_y - right_y| normalized (어깨 기울기)
  neckAngle: number;        // 수직 기준 목 각도 (degrees)
  cva: number;              // craniovertebral angle 근사값 (degrees)
}

export interface ActiveAlert {
  id: number;
  count: number;
  max: number;
  message: string;
  angle: number;
}

interface PostureContextType {
  postureState: PostureState;
  warningsCount: number;
  plantExp: number;
  activeAlert: ActiveAlert | null;
  baseline: PostureBaseline | null;
  hasCalibrated: boolean;
  triggerWarning: (angle?: number) => void;
  triggerDanger: (angle?: number) => void;
  resetPosture: () => void;
  unlockScreen: () => void;
  dismissAlert: () => void;
  addPlantExp: (amount: number) => void;
  setBaseline: (b: PostureBaseline) => void;
}

const BASELINE_KEY = 'baro_posture_baseline';
const MAX_WARNINGS = 3;

const MESSAGES: Record<number, string> = {
  1: '거북목 자세가 감지되었습니다. 자세를 바로잡아주세요.',
  2: '경고가 2회 누적됐습니다. 어깨와 목을 펴주세요.',
  3: '경고 3회 누적! 잠시 후 화면이 잠깁니다.',
};

const PostureContext = createContext<PostureContextType | undefined>(undefined);

function loadBaseline(): PostureBaseline | null {
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? (JSON.parse(raw) as PostureBaseline) : null;
  } catch {
    return null;
  }
}

export const PostureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [postureState, setPostureState] = useState<PostureState>('good');
  const [warningsCount, setWarningsCount] = useState(0);
  const [plantExp, setPlantExp] = useState(150);
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [baseline, setBaselineState] = useState<PostureBaseline | null>(loadBaseline);

  const hasCalibrated = baseline !== null;

  const setBaseline = (b: PostureBaseline) => {
    setBaselineState(b);
    localStorage.setItem(BASELINE_KEY, JSON.stringify(b));
  };

  const triggerWarning = (angle = 30) => {
    if (postureState === 'locked') return;
    setPostureState('warning');
    setWarningsCount((prev) => {
      const next = prev + 1;
      setActiveAlert({ id: Date.now(), count: next, max: MAX_WARNINGS, message: MESSAGES[next] ?? MESSAGES[1], angle });
      if (next >= MAX_WARNINGS) {
        setTimeout(() => setPostureState('locked'), 1500);
      }
      return next;
    });
  };

  const triggerDanger = (angle = 40) => {
    if (postureState === 'locked') return;
    setPostureState('danger');
    setWarningsCount((prev) => {
      const next = prev + 1;
      setActiveAlert({ id: Date.now(), count: next, max: MAX_WARNINGS, message: MESSAGES[next] ?? MESSAGES[1], angle });
      if (next >= MAX_WARNINGS) {
        setTimeout(() => setPostureState('locked'), 1500);
      }
      return next;
    });
  };

  const dismissAlert = () => setActiveAlert(null);

  const resetPosture = () => {
    if (postureState === 'locked') return;
    setPostureState('good');
  };

  const unlockScreen = () => {
    setPostureState('good');
    setWarningsCount(0);
    setActiveAlert(null);
  };

  const addPlantExp = (amount: number) => {
    setPlantExp((prev) => Math.min(prev + amount, 1000));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (postureState === 'good') {
        addPlantExp(5);
      } else if (postureState === 'warning' || postureState === 'danger') {
        setPlantExp((prev) => Math.max(prev - 2, 0));
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [postureState]);

  return (
    <PostureContext.Provider value={{
      postureState, warningsCount, plantExp, activeAlert,
      baseline, hasCalibrated, setBaseline,
      triggerWarning, triggerDanger, resetPosture, unlockScreen, dismissAlert, addPlantExp,
    }}>
      {children}
    </PostureContext.Provider>
  );
};

export const usePosture = () => {
  const context = useContext(PostureContext);
  if (context === undefined) throw new Error('usePosture must be used within a PostureProvider');
  return context;
};
