import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

const RECENTLY_PLAYED = [
  { id: '1', name: 'Genshin Impact', sub: 'Last active 2h ago', icon: require('@/assets/images/apps/genshin.png') },
  { id: '2', name: 'Instagram', sub: 'Last active 5h ago', icon: require('@/assets/images/apps/instagram.png') },
  { id: '3', name: 'Wuthering Waves', sub: 'Last active 1d ago', icon: require('@/assets/images/apps/wuwa.png') },
  { id: '4', name: 'TikTok', sub: 'Last active 2d ago', icon: require('@/assets/images/apps/tiktok.png') },
  { id: '5', name: 'Roblox', sub: 'Last active 3d ago', icon: require('@/assets/images/apps/robolox.png') },
  { id: '6', name: 'CapCut', sub: 'Last active 1w ago', icon: require('@/assets/images/apps/capcut.png') },
  { id: '7', name: 'Spotify', sub: 'Last active 1w ago', icon: require('@/assets/images/apps/spotify.png') },
  { id: '8', name: 'Zenless Zone Zero', sub: 'Last active 2w ago', icon: require('@/assets/images/apps/zzz.png') },
  { id: '9', name: 'WhatsApp', sub: 'Last active 2w ago', icon: require('@/assets/images/apps/whatsapp.png') },
  { id: '10', name: 'Zoom', sub: 'Last active 1mo ago', icon: require('@/assets/images/apps/zoom.png') },
];

export default function LibraryScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const themeMode = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[themeMode];

  const renderAppRow = ({ item }: { item: typeof RECENTLY_PLAYED[0] }) => (
    <View style={styles.appCard}>
      <TouchableOpacity style={styles.appRow} onPress={() => router.push(`/stream/${item.name}`)}>
        <Image source={item.icon} style={styles.appIcon} resizeMode="contain" />
        <View style={styles.appInfo}>
          <ThemedText type="default" style={[styles.appName, { fontWeight: '600', color: colors.text }]}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={styles.appSub}>{item.sub}</ThemedText>
        </View>
        <TouchableOpacity style={styles.openBtn} onPress={() => router.push(`/stream/${item.name}`)}>
          <ThemedText type="smallBold" style={{ color: '#007AFF' }}>OPEN</ThemedText>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Apps', headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.header}>
        <ThemedText type="title" style={styles.title}>Apps</ThemedText>
      </SafeAreaView>

      <FlatList
        data={RECENTLY_PLAYED}
        renderItem={renderAppRow}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recently Used</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 10,
  },
  appCard: {
    marginBottom: 16,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 17,
  },
  appSub: {
    opacity: 0.5,
    fontSize: 13,
  },
  openBtn: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  }
});
