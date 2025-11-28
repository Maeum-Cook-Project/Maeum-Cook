import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useRouter,useSegments } from 'expo-router';
import { useWebSocket } from './WebSocketContext';

interface TimerContextType {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  startTimer: (minutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const soundRef = useRef<Audio.Sound|null>(null);
  const intervalRef = useRef<any>(null);
  
  const router = useRouter();
  const segments = useSegments();
  const {sendJsonCommand,isConnected,lastMessage}=useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      try {
        const cmd = JSON.parse(lastMessage);
        
        // 서버에서 "타이머 설정" 명령이 왔을 때
        if (cmd.device === 'induction' && cmd.command === 'timer') {
          console.log(`[TimerContext] 서버 명령 수신: ${cmd.value}초 타이머 시작`);
          
          // 초(Seconds)를 분(Minutes)으로 변환 (올림 처리)
          // 예: 60초 -> 1분, 180초 -> 3분
          const minutes = Math.ceil(cmd.value / 60);
          
          // 앱 내부 타이머 시작!
          startTimer(minutes);
          router.push('/(tabs)/(home)/timer');
        }
      } catch (e) {
        console.error("[TimerContext] 메시지 파싱 오류:", e);
      }
    }
  }, [lastMessage]);


  // 1. 타이머 카운트다운 로직
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // 0초가 되는 순간
            clearInterval(intervalRef.current!);
            handleTimerFinish(); // 종료 처리 호출
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeRemaining]);

  // 2. 알람 소리 재생 함수
  const playAlarmSound = async () => {
    try {
      // 오디오 모드 설정 (무음 모드에서도 소리 나게)
      if(soundRef.current){
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
         require('@/assets/sounds/alarm.wav') 
      );
      soundRef.current=sound;
      await sound.setIsLoopingAsync(true); 
      await sound.playAsync();
    } catch (error) {
      console.log("알람 소리 재생 실패:", error);
    }
  };

  // 3. 알람 끄기 함수
  const stopAlarmSound = async () => {
    if(soundRef.current){
      try{
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current=null;
        console.log("알람 소리 꺼짐");
      }catch(e){
        console.log("알람 정지 실패 : ",e);
      }
    }
  };

  // 4. 타이머 종료 시 실행되는 핵심 로직
  const handleTimerFinish = async () => {
    setIsRunning(false); // 타이머 멈춤

    // (1) 진동 & 소리
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playAlarmSound();

    const isTimerScreen = segments[segments.length-1]==='timer';

    // (2) 알림창 띄우기
    Alert.alert(
      "타이머 종료! ⏰",
      "설정 시간이 되었습니다! 요리를 확인하세요!",
      [
        {
          text: "확인",
          onPress: async () => {
            await stopAlarmSound(); // 소리 끄기
            resetTimer(); // 시간 초기화

            if(isTimerScreen){
              router.back();
            }
          },
          style:'default',
        }
      ],
      {cancelable:false}
    );
  };

  const startTimer = (minutes: number) => {
    const seconds = minutes * 60;
    setTotalTime(seconds);
    setTimeRemaining(seconds);
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);
  
  const resumeTimer = () => setIsRunning(true);

  const resetTimer = () => {
    setIsRunning(false);
    setTotalTime(0);
    setTimeRemaining(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const stopTimer = async () => {
    await stopAlarmSound();
    resetTimer();
  };

  return (
    <TimerContext.Provider
      value={{
        timeRemaining,
        totalTime,
        isRunning,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        stopTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};