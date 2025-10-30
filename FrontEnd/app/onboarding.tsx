
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

type OnboardingStep = 'welcome' | 'searching' | 'deviceList' | 'connecting' | 'complete';

interface Device {
  id: string;
  name: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [waveAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animated wave effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const startSearch = () => {
    setStep('searching');
    // Simulate device search
    setTimeout(() => {
      setDevices([
        { id: '1', name: 'RubikPi_LivingRoom' },
        { id: '2', name: 'RubikPi_Kitchen' },
        { id: '3', name: 'RubikPi_Office' },
      ]);
      setStep('deviceList');
    }, 2000);
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    setShowConfirmModal(true);
  };

  const connectToDevice = () => {
    setShowConfirmModal(false);
    setStep('connecting');
    // Simulate connection
    setTimeout(() => {
      setStep('complete');
    }, 2000);
  };

  const completeOnboarding = async () => {
    try {
      // Fixed: Use the same key as in _layout.tsx
      await AsyncStorage.setItem('onboarding_completed', 'true');
      console.log('Onboarding completed and saved to AsyncStorage');
      router.replace('/(tabs)/(home)/');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(tabs)/(home)/');
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <IconSymbol name="wifi" size={80} color={colors.secondary} />
      </View>
      <Text style={styles.title}>기기를 연결해{'\n'}IoT 환경을 설정하세요</Text>
      <Text style={styles.description}>
        같은 Wi-Fi 네트워크에 있는{'\n'}게이트웨이를 찾아 연결합니다
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={startSearch}>
        <Text style={styles.primaryButtonText}>연결 시작하기</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearching = () => {
    const scale = waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.3],
    });

    const opacity = waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0],
    });

    return (
      <View style={styles.stepContainer}>
        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.waveCircle,
              styles.wave1,
              { transform: [{ scale }], opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.waveCircle,
              styles.wave2,
              { transform: [{ scale }], opacity },
            ]}
          />
          <View style={styles.centerIcon}>
            <IconSymbol name="wifi" size={60} color={colors.secondary} />
          </View>
        </View>
        <Text style={styles.title}>같은 네트워크에서{'\n'}IOT 기기를 검색 중입니다...</Text>
        <ActivityIndicator size="large" color={colors.secondary} style={styles.loader} />
      </View>
    );
  };

  const renderDeviceList = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>발견된 기기</Text>
      <Text style={styles.description}>연결할 기기를 선택하세요</Text>
      <View style={styles.deviceList}>
        {devices.map((device) => (
          <TouchableOpacity
            key={device.id}
            style={styles.deviceCard}
            onPress={() => handleDeviceSelect(device)}
          >
            <IconSymbol name="wifi" size={32} color={colors.secondary} />
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceStatus}>사용 가능</Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderConnecting = () => {
    const scale = waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    return (
      <View style={styles.stepContainer}>
        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.connectingCircle,
              { transform: [{ scale }] },
            ]}
          />
          <View style={styles.centerIcon}>
            <IconSymbol name="wifi" size={60} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.title}>연결 중...</Text>
        <Text style={styles.description}>{selectedDevice?.name}</Text>
      </View>
    );
  };

  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIcon}>
        <IconSymbol name="checkmark.circle.fill" size={100} color={colors.primary} />
      </View>
      <Text style={styles.title}>{selectedDevice?.name}{'\n'}연결이 완료되었습니다!</Text>
      <Text style={styles.description}>이제 스마트 키친을 사용할 수 있습니다</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={completeOnboarding}>
        <Text style={styles.primaryButtonText}>홈으로 이동</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {step === 'welcome' && renderWelcome()}
      {step === 'searching' && renderSearching()}
      {step === 'deviceList' && renderDeviceList()}
      {step === 'connecting' && renderConnecting()}
      {step === 'complete' && renderComplete()}

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>기기 연결</Text>
            <Text style={styles.modalDescription}>
              이 기기와 연결하시겠습니까?{'\n\n'}
              <Text style={styles.modalDeviceName}>{selectedDevice?.name}</Text>
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={connectToDevice}
              >
                <Text style={styles.modalButtonConfirmText}>연결하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 200,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  animationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  waveCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  wave1: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  wave2: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  centerIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loader: {
    marginTop: 24,
  },
  deviceList: {
    width: '100%',
    marginTop: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 16,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  deviceStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  connectingCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.secondary,
  },
  successIcon: {
    marginBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalDeviceName: {
    fontWeight: '600',
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    paddingVertical: 12,
  },
  modalButtonCancelText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
