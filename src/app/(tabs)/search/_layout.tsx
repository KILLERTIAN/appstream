import { Stack } from 'expo-router';
import React from 'react';

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerTitle: () => null,
      }}
    >
      <Stack.Screen name="index" options={{ title: '' }} />
    </Stack>
  );
}

