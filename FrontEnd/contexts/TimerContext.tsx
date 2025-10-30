
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TimerContextType {
  isTimerActive: boolean;
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  startTimer: (minutes: number) => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  updateTimeRemaining: (time: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            setIsTimerActive(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeRemaining]);

  const startTimer = (minutes: number) => {
    const seconds = minutes * 60;
    setTotalTime(seconds);
    setTimeRemaining(seconds);
    setIsTimerActive(true);
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsTimerActive(false);
    setIsRunning(false);
    setTimeRemaining(0);
    setTotalTime(0);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resumeTimer = () => {
    setIsRunning(true);
  };

  const resetTimer = () => {
    setTimeRemaining(totalTime);
    setIsRunning(true);
  };

  const updateTimeRemaining = (time: number) => {
    setTimeRemaining(time);
  };

  return (
    <TimerContext.Provider
      value={{
        isTimerActive,
        timeRemaining,
        totalTime,
        isRunning,
        startTimer,
        stopTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        updateTimeRemaining,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};
