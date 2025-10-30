
import { Stack } from 'expo-router';
import React from 'react';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="timer" 
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="recipe-chat" 
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
