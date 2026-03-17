import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const themeMode = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[themeMode];

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      backgroundColor={colors.background}
      indicatorColor="#007AFF"
      labelStyle={{ 
        selected: { color: '#007AFF' }
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        {/* @ts-ignore - SDK 55 uses sf prop */}
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        {/* @ts-ignore */}
        <NativeTabs.Trigger.Icon
          sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Label>Apps</NativeTabs.Trigger.Label>
        {/* @ts-ignore */}
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.stack.3d.up', selected: 'square.stack.3d.up.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        {/* @ts-ignore */}
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
