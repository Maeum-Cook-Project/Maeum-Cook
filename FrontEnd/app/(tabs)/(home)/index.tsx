
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Slider from '@react-native-community/slider';
import { useTimer } from '@/contexts/TimerContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isTimerActive, timeRemaining, startTimer } = useTimer();
  
  // Device states
  const [inductionPower, setInductionPower] = useState(false);
  const [inductionLevel, setInductionLevel] = useState(0);
  const [sinkWater, setSinkWater] = useState(false);
  const [ventilation, setVentilation] = useState(false);
  const [hasChattedBefore, setHasChattedBefore] = useState(false);

  // Sample ingredients
  const [ingredients, setIngredients] = useState([
    '양파', '당근', '감자', '돼지고기', '계란'
  ]);

  const handleTimerSelect = (minutes: number) => {
    startTimer(minutes);
    router.push({
      pathname: '/(tabs)/(home)/timer',
      params: { minutes: minutes.toString() },
    });
  };

  const handleRecipeChat = () => {
    setHasChattedBefore(true);
    router.push('/(tabs)/(home)/recipe-chat');
  };

  const handleNewRecipeChat = () => {
    router.push({
      pathname: '/(tabs)/(home)/recipe-chat',
      params: { newChat: 'true' },
    });
  };

  const handleContinueChat = () => {
    router.push('/(tabs)/(home)/recipe-chat');
  };

  // Snap slider to nearest level (0, 33.33, 66.66, 100)
  const handleSliderComplete = (value: number) => {
    let snappedValue = 0;
    if (value < 16.67) {
      snappedValue = 0;
    } else if (value < 50) {
      snappedValue = 33.33;
    } else if (value < 83.33) {
      snappedValue = 66.66;
    } else {
      snappedValue = 100;
    }
    setInductionLevel(snappedValue);
  };

  const renderFlameIcons = (level: number) => {
    const flames = [];
    const activeLevel = Math.ceil(level / 33.33);
    
    for (let i = 1; i <= 3; i++) {
      flames.push(
        <Text key={i} style={[styles.flameIcon, i <= activeLevel && styles.flameActive]}>
          🔥
        </Text>
      );
    }
    return flames;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Kitchen</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Induction Control */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceIcon}>🍳</Text>
              <View>
                <Text style={styles.deviceName}>인덕션</Text>
                <Text style={styles.deviceBrand}>Samsung</Text>
              </View>
            </View>
            <Switch
              value={inductionPower}
              onValueChange={setInductionPower}
              trackColor={{ false: colors.highlight, true: colors.accent }}
              thumbColor={inductionPower ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          {inductionPower && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>화력 조절</Text>
              <View style={styles.flameContainer}>
                {renderFlameIcons(inductionLevel)}
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={inductionLevel}
                onValueChange={setInductionLevel}
                onSlidingComplete={handleSliderComplete}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.highlight}
                thumbTintColor={colors.accent}
                step={0.01}
              />

              {!isTimerActive ? (
                <>
                  <Text style={styles.sectionLabel}>타이머 설정</Text>
                  <View style={styles.timerButtons}>
                    <TouchableOpacity
                      style={styles.timerButton}
                      onPress={() => handleTimerSelect(1)}
                    >
                      <IconSymbol name="timer" size={20} color={colors.accent} />
                      <Text style={styles.timerButtonText}>1분</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.timerButton}
                      onPress={() => handleTimerSelect(3)}
                    >
                      <IconSymbol name="timer" size={20} color={colors.accent} />
                      <Text style={styles.timerButtonText}>3분</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.timerButton}
                      onPress={() => handleTimerSelect(5)}
                    >
                      <IconSymbol name="timer" size={20} color={colors.accent} />
                      <Text style={styles.timerButtonText}>5분</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.timerActiveContainer}>
                  <Text style={styles.timerActiveLabel}>타이머 작동 중</Text>
                  <Text style={styles.timerActiveTime}>{formatTime(timeRemaining)}</Text>
                  <TouchableOpacity
                    style={styles.viewTimerButton}
                    onPress={() => router.push('/(tabs)/(home)/timer')}
                  >
                    <Text style={styles.viewTimerButtonText}>타이머 보기</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* Sink Control */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceIcon}>💧</Text>
              <View>
                <Text style={styles.deviceName}>싱크대</Text>
                <Text style={styles.deviceBrand}>Samsung</Text>
              </View>
            </View>
            <Switch
              value={sinkWater}
              onValueChange={setSinkWater}
              trackColor={{ false: colors.highlight, true: colors.secondary }}
              thumbColor={sinkWater ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Ventilation Control */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceIcon}>💨</Text>
              <View>
                <Text style={styles.deviceName}>환풍기</Text>
                <Text style={styles.deviceBrand}>Samsung</Text>
              </View>
            </View>
            <Switch
              value={ventilation}
              onValueChange={setVentilation}
              trackColor={{ false: colors.highlight, true: colors.primary }}
              thumbColor={ventilation ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Ingredients Preview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>보유 식재료</Text>
          <View style={styles.ingredientsList}>
            {ingredients.slice(0, 5).map((ingredient, index) => (
              <View key={index} style={styles.ingredientChip}>
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.ingredientNote}>
            하단 메뉴에서 식재료를 추가/삭제할 수 있습니다
          </Text>
        </View>

        {/* Recipe Recommendation */}
        {!hasChattedBefore ? (
          <TouchableOpacity style={styles.recipeButton} onPress={handleRecipeChat}>
            <Text style={styles.recipeButtonText}>레시피 추천받기</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.recipeButtonsContainer}>
            <TouchableOpacity
              style={[styles.recipeButton, styles.recipeButtonHalf]}
              onPress={handleNewRecipeChat}
            >
              <Text style={styles.recipeButtonText}>새로운 레시피 추천받기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.recipeButton, styles.recipeButtonHalf, styles.recipeButtonSecondary]}
              onPress={handleContinueChat}
            >
              <Text style={styles.recipeButtonText}>이전 추천 이어받기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIcon: {
    fontSize: 32,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  deviceBrand: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.highlight,
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  flameContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  flameIcon: {
    fontSize: 32,
    opacity: 0.3,
  },
  flameActive: {
    opacity: 1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  timerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timerActiveContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  timerActiveLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  timerActiveTime: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 12,
  },
  viewTimerButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  viewTimerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  ingredientChip: {
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ingredientText: {
    fontSize: 14,
    color: colors.text,
  },
  ingredientNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  recipeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recipeButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  recipeButtonHalf: {
    flex: 1,
  },
  recipeButtonSecondary: {
    backgroundColor: colors.secondary,
  },
});
