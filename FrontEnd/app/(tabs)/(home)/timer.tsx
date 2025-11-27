import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Svg, { Circle } from 'react-native-svg';
import { useTimer } from '@/contexts/TimerContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TimerScreen() {
  const router = useRouter();
  const { 
    timeRemaining, 
    totalTime, 
    isRunning, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    stopTimer 
  } = useTimer();
  
  const [progress] = useState(new Animated.Value(0));

  const radius = 120;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  // 애니메이션 효과
  useEffect(() => {
    if (totalTime > 0) {
      const progressValue = 1 - (timeRemaining / totalTime);
      Animated.timing(progress, {
        toValue: progressValue,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [timeRemaining, totalTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  };

  const handleReset = () => {
    resetTimer();
  };

  const cancelTimer = () => {
    stopTimer();
    router.back();
  };

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <IconSymbol name="chevron.left" size={24} color={colors.text} />
        <Text style={styles.backButtonText}>메인으로</Text>
      </TouchableOpacity>

      <View style={styles.timerContainer}>
        <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
          <Circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={colors.highlight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={timeRemaining === 0 && totalTime > 0 ? "#FF4444" : colors.accent}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${radius + strokeWidth}, ${radius + strokeWidth}`}
          />
        </Svg>
        <View style={styles.timeDisplay}>
          <Text style={[
            styles.timeText, 
            timeRemaining === 0 && totalTime > 0 && { color: "#FF4444" }
          ]}>
            {formatTime(timeRemaining)}
          </Text>
          {timeRemaining === 0 && totalTime > 0 && (
            <Text style={styles.finishText}>완료!</Text>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={cancelTimer}>
          <IconSymbol name="trash" size={24} color={colors.accent} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.mainControlButton]}
          onPress={togglePause}
        >
          <IconSymbol
            name={isRunning ? 'pause.fill' : 'play.fill'}
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
          <IconSymbol name="arrow.clockwise" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backButtonText: { fontSize: 16, color: colors.text, marginLeft: 8, fontWeight: '600' },
  timerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timeDisplay: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  timeText: { fontSize: 64, fontWeight: '700', color: colors.accent },
  finishText: { fontSize: 24, fontWeight: '600', color: '#FF4444', marginTop: 8 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 80, gap: 24 },
  controlButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.accent },
  mainControlButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, borderWidth: 0 },
});