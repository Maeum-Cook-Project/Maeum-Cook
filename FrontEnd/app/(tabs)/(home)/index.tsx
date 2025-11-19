
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
import { useWebSocket } from '@/contexts/WebSocketContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isTimerActive, timeRemaining, startTimer } = useTimer();

  //Websocket연결 전송&수신 가능
  const {isConnected,sendJsonCommand,lastMessage} = useWebSocket();

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

  //WebSocket 수신기(상태 동기화 구현) 외부 통신으로부터 상태 변경
  useEffect(()=>{
    if(lastMessage){
      try{
        const cmd=JSON.parse(lastMessage);

        // 1.인덕션 명령 수신
        if (cmd.device==='induction'){
          if(cmd.command==='power'){
            const newStatus=cmd.value==='on';
            setInductionPower(newStatus);
            if (!newStatus) setInductionLevel(0);
          }else if (cmd.command==='level'){
            setInductionLevel(cmd.value);
          }else if (cmd.command=='timer'){
            //타이머가 설정되었다는 UI표시 해야함
            //도전 과제
          }
        }
        //2. 환풍기 명령 수신
        else if (cmd.device==='fan'){
          setVentilation(cmd.value==='on');
        }
        
        //3. 싱크대 명령 수신
        else if (cmd.device==='sink'){
          setSinkWater(cmd.value==='on');
        }
      }catch(e){
        console.error("수신한 JSON 파싱 오류 : ",e);
      }
    }
  },[lastMessage]);//lastMessage 바뀔 때마다 로직 실행

  //송신기 명령 전송 로직 앱 UI 변경이 서버로 명령 전송

  //1. 인덕션 on/off
  const handleInductionToggle = (isOn: boolean)=>{
    sendJsonCommand({
      device:"induction",
      command: "power",
      value:isOn ? "on" : "off"
    });
    //UI도 바로 반영 but useEffect가 서버 응답 받아 처리하는게 이상적임
    //setInductionPower(isOn);
    if(!isOn) setInductionLevel(0);
  };
  //2.싱크대 on/off
  const handleSinkToggle = (isOn:boolean)=>{
    sendJsonCommand({
      device:"sink",
      command:"power",
      value:isOn?"on":"off"
    });
    //setSinkWater(isOn);
  };
  //3. 환풍기 on/off
  const handleVentilationToggle = (isOn: boolean) => {
    sendJsonCommand({
      device: "fan",
      command: "power",
      value: isOn ? "on" : "off"
    });
    //setVentilation(isOn);
  };

  //4. 인덕션 on/off
  const handleSliderComplete = (value : number)=>{
    let level=0; 
    let snappedValue=0;

    if (value<16.67){
      level=0; snappedValue=0;
    }else if (value<50){
      level=1; snappedValue=33.33;
    }else if (value<83.33){
      level=2; snappedValue=66.66;
    }else{
      level=3; snappedValue=100;
    }
    //setInductionLevel(level);
    if (level === 0) {
      // 0으로 내리면 '끄기' 명령 전송
      sendJsonCommand({ device: "induction", command: "power", value: "off"});
      //setInductionPower(false); // 스위치도 끄기
    } else {
      // 1, 2, 3단은 '화력 조절' 명령 전송
      sendJsonCommand({ device: "induction", command: "level", value: level });
    }
  };

  const handleSliderChanging = (value:number) => {
    let level=0;
    if (value<16.67) level=0;
    else if (value<50) level=1;
    else if (value <83.33) level=2;
    else level=3;

    //슬라이더 움직이는 동안 서버 전송 없이 UI만 변경
    setInductionLevel(level);
  };

  const handleTimerSelect = (minutes: number) => {
    const seconds = minutes * 60;

    // 서버로 '타이머 설정' 명령 전송
    let type = 1; // 1분
    if (minutes === 3) type = 2; // 3분
    if (minutes === 5) type = 3; // 5분
    
    sendJsonCommand({
      device: "induction",
      command: "timer",
      value: seconds
    });

    // 기존 타이머 화면 이동 로직
    startTimer(minutes);
    router.push({
      pathname: '/(tabs)/(home)/timer',
      params: { minutes: minutes.toString() },
    });
  };

  const handleRecipeChat = () => {
    setHasChattedBefore(true);
    router.push('/recipe-chat');
  };

  const handleNewRecipeChat = () => {
    router.push({
      pathname: '/recipe-chat',
      params: { newChat: 'true' },
    });
  };

  const handleContinueChat = () => {
    router.push('/recipe-chat');
  };

  const renderFlameIcons = (level: number) => {
    const flames = [];
    
    for (let i = 1; i <= 3; i++) {
      flames.push(
        <Text key={i} style={[styles.flameIcon, i <= level&&styles.flameActive]}>
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

  //Slider의 UI rkqt (0-100)을 level(0-3)로부터 변환
  const getSliderValue=()=>{
    if (inductionLevel===1) return 33.33;
    else if(inductionLevel===2) return 66.66;
    else if(inductionLevel===3) return 100;
    else return 0;
  }

  //Render(UI)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={isConnected ? styles.statusConnected:styles.statusOffline}>
          {isConnected? "QCS6490 연결됨" : "서버 연결 끊김"}
        </Text>
        <Text style={styles.headerTitle}>Maeum Kitchen</Text>
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
              onValueChange={handleInductionToggle}
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
                value={getSliderValue()}
                onValueChange={handleSliderChanging}
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
              onValueChange={handleSinkToggle}
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
              onValueChange={handleVentilationToggle}
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
  statusConnected:{
    position:'absolute',
    top:Platform.OS==='ios'?60:40,
    right:20,
    fontSize:12,
    color:'green',
    fontWeight:'bold',
  },
  statusOffline:{
    position:'absolute',
    top:Platform.OS==='ios'?60:40,
    right:20,
    fontSize:12,
    color:'red',
    fontWeight:'bold',
  },
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
