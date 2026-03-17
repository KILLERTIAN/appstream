import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/glass-card';
import { Spacing, Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

const NOTIFICATIONS = [
  { 
    id: '1', 
    title: 'Update Ready', 
    body: 'Genshin Impact Version 5.2 is now available for instant streaming.', 
    time: '12m ago', 
    icon: 'sparkles', 
    color: '#007AFF',
    appIcon: require('@/assets/images/apps/genshin.png')
  },
  { 
    id: '2', 
    title: 'Trending App', 
    body: 'Everyone is playing Zenless Zone Zero. Start streaming instantly!', 
    time: '1h ago', 
    icon: 'chart.line.uptrend.xyaxis', 
    color: '#34C759',
    appIcon: require('@/assets/images/apps/zzz.png')
  },
  { 
    id: '3', 
    title: 'New Game Released', 
    body: 'Wuthering Waves is now available on AppStream. Experience ultra-fast combat.', 
    time: '3h ago', 
    icon: 'gamecontroller.fill', 
    color: '#FF2D55',
    appIcon: require('@/assets/images/apps/wuwa.png')
  },
  { 
    id: '4', 
    title: 'Cloud Optimization', 
    body: 'Your streaming bitrate has been adjusted for the best 4K experience.', 
    time: '5h ago', 
    icon: 'bolt.shield.fill', 
    color: '#FF9500',
    appIcon: null
  },
];

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const themeMode = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[themeMode];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Notifications', headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <ThemedText type="title">Alerts</ThemedText>
            <TouchableOpacity style={styles.profileButton}>
                <Image 
                    source={{ uri: 'https://i.pravatar.cc/150?u=om' }} 
                    style={styles.avatar}
                />
            </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {NOTIFICATIONS.map(notif => (
            <TouchableOpacity key={notif.id} style={styles.notifRow}>
               {notif.appIcon ? (
                 <Image source={notif.appIcon} style={styles.notifAppIcon} />
               ) : (
                 <View style={[styles.iconBox, { backgroundColor: notif.color + '15' }]}>
                   <SymbolView name={notif.icon as any} size={20} tintColor={notif.color} />
                 </View>
               )}
               <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <ThemedText type="default" style={[styles.notifTitle, { fontWeight: '600' }]}>{notif.title}</ThemedText>
                    <ThemedText type="small" style={styles.time}>{notif.time}</ThemedText>
                  </View>
                  <ThemedText type="small" style={styles.body}>{notif.body}</ThemedText>
               </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    marginBottom: Spacing.four,
  },
  profileButton: {},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  notifRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  notifAppIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 16,
  },
  time: {
    opacity: 0.4,
    fontSize: 11,
  },
  body: {
    opacity: 0.6,
    lineHeight: 18,
    fontSize: 13,
  }
});
