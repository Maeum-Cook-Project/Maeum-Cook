
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 40,
  borderRadius = 25,
  bottomMargin = 20,
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  const activeIndex = tabs.findIndex((tab) => pathname.includes(tab.name));
  const translateX = useSharedValue(activeIndex >= 0 ? activeIndex : 0);

  useEffect(() => {
    const index = tabs.findIndex((tab) => pathname.includes(tab.name));
    if (index >= 0) {
      translateX.value = withSpring(index, {
        damping: 20,
        stiffness: 90,
      });
    }

    // Hide tab bar on recipe-chat and timer screens
    console.log('Current pathname:', pathname);
    if (pathname.includes('recipe-chat') || pathname.includes('timer')) {
      console.log('Hiding tab bar');
      setIsVisible(false);
    } else {
      console.log('Showing tab bar');
      setIsVisible(true);
    }
  }, [pathname, tabs]);

  const animatedStyle = useAnimatedStyle(() => {
    const itemWidth = containerWidth / tabs.length;
    return {
      transform: [{ translateX: translateX.value * itemWidth }],
      width: itemWidth,
    };
  });

  const handleTabPress = (route: string) => {
    router.push(route);
  };

  // Don't render the tab bar at all when it should be hidden
  if (!isVisible) {
    return null;
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.safeArea, { marginBottom: bottomMargin }]}
    >
      <BlurView
        intensity={80}
        tint="light"
        style={[
          styles.container,
          {
            width: containerWidth,
            borderRadius: borderRadius,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.activeIndicator,
            animatedStyle,
            { borderRadius: borderRadius - 5 },
          ]}
        />
        {tabs.map((tab, index) => {
          const isActive = activeIndex === index;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={tab.icon}
                size={24}
                color={isActive ? '#FF6B6B' : '#717171'}
              />
              <Text
                style={[
                  styles.label,
                  { color: isActive ? '#FF6B6B' : '#717171' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  activeIndicator: {
    position: 'absolute',
    height: 60,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    top: 5,
    left: 5,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
