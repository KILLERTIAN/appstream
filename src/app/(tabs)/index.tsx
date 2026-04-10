import { Image as ExpoImage } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/glass-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const FEATURED_COLLECTION = [
  {
    id: 'f1',
    title: 'NEW DISCOVERY',
    name: 'Wuthering Waves',
    tagline: 'An open-world action RPG with deep combat.',
    image: require('@/assets/images/apps/wuwa_bg.png'),
    icon: require('@/assets/images/apps/wuwa.png'),
  },
  {
    id: 'f2',
    title: 'FEATURED GAME',
    name: 'Genshin Impact',
    tagline: 'Step into a vast magical world of adventure.',
    image: require('@/assets/images/apps/genshin_bg.png'),
    icon: require('@/assets/images/apps/genshin.png'),
  },

  {
    id: 'f3',
    title: 'TRENDING NOW',
    name: 'Zenless Zone Zero',
    tagline: 'Stylish urban action with anime aesthetics.',
    image: require('@/assets/images/apps/zzz_bg.png'),
    icon: require('@/assets/images/apps/zzz.png'),
  },
] as const;

const TOP_APPS = [
  { id: 'z1', name: 'Zomato', sub: 'Food Delivery • Fast', icon: require('@/assets/images/apps/zomato.png') },
  { id: 's1', name: 'Swiggy', sub: 'Food Delivery • Instant', icon: require('@/assets/images/apps/swiggy.png') },
  { id: 'a1', name: 'Amazon', sub: 'Shopping • Global', icon: require('@/assets/images/apps/amazon.png') },
  { id: '1', name: 'Roblox', sub: 'Adventure • Huge World', icon: require('@/assets/images/apps/robolox.png') },
  { id: '2', name: 'Instagram', sub: 'Social • Creative', icon: require('@/assets/images/apps/instagram.png') },
  { id: 'c1', name: 'Chess', sub: 'Board Game • Strategy', icon: require('@/assets/images/apps/chess.png') },
  { id: 'u1', name: 'Uno', sub: 'Card Game • Multiplayer', icon: require('@/assets/images/apps/zzz.png') },
  { id: '3', name: 'TikTok', sub: 'Video • Entertaining', icon: require('@/assets/images/apps/tiktok.png') },
  { id: '4', name: 'CapCut', sub: 'Video Editor • Pro', icon: require('@/assets/images/apps/capcut.png') },
  { id: '5', name: 'Spotify', sub: 'Music • Premium', icon: require('@/assets/images/apps/spotify.png') },
  { id: '6', name: 'WhatsApp', sub: 'Messenger • Secure', icon: require('@/assets/images/apps/whatsapp.png') },
  { id: '8', name: 'Slack', sub: 'Communicate • Team', icon: require('@/assets/images/apps/slack.png') },
] as const;

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Update Ready',
    body: 'Genshin Impact Version 5.2 is now available for instant streaming.',
    time: '12m ago',
    icon: 'sparkles',
    color: '#007AFF',
    appIcon: require('@/assets/images/apps/genshin.png'),
  },
  {
    id: '2',
    title: 'Trending App',
    body: 'Everyone is playing Zenless Zone Zero. Start streaming instantly!',
    time: '1h ago',
    icon: 'chart.line.uptrend.xyaxis',
    color: '#34C759',
    appIcon: require('@/assets/images/apps/zzz.png'),
  },
  {
    id: '3',
    title: 'New Game Released',
    body: 'Wuthering Waves is now available on AppStream.',
    time: '3h ago',
    icon: 'gamecontroller.fill',
    color: '#FF2D55',
    appIcon: require('@/assets/images/apps/wuwa.png'),
  },
] as const;

function streamPath(appName: string) {
  return `/stream/${encodeURIComponent(appName)}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const themeMode = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[themeMode];
  const [showNotifs, setShowNotifs] = useState(false);

  const renderFeatured = ({ item }: { item: (typeof FEATURED_COLLECTION)[number] }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.featuredTouch}
      onPress={() => {
        console.log('[NAV] stream open (featured):', item.name);
        router.push(streamPath(item.name));
      }}
    >
      <ThemedText type="smallBold" style={styles.featuredLabel}>
        {item.title}
      </ThemedText>
      <ThemedText type="subtitle" style={styles.featuredName}>
        {item.name}
      </ThemedText>
      <ThemedText type="default" style={styles.featuredTagline} numberOfLines={1}>
        {item.tagline}
      </ThemedText>
      <ImageBackground source={item.image} style={styles.featuredImage} imageStyle={{ borderRadius: 14 }}>
        <View style={styles.featuredOverlay}>
          <GlassCard style={styles.featuredIconContainer}>
            <Image source={item.icon} style={styles.featuredIcon} />
            <View style={styles.featuredIconText}>
              <ThemedText type="smallBold" style={{ color: '#FFF' }}>
                {item.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: '#FFF', opacity: 0.8 }}>
                Stream Now
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.featuredGetBtn}
              onPress={() => {
                console.log('[NAV] stream open (featured btn):', item.name);
                router.push(streamPath(item.name));
              }}
            >
              <ThemedText type="smallBold" style={{ color: '#007AFF' }}>
                OPEN
              </ThemedText>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderAppListItem = ({ item }: { item: (typeof TOP_APPS)[number] }) => (
    <TouchableOpacity
      style={styles.appListItem}
      onPress={() => {
        console.log('[NAV] stream open (list):', item.name);
        router.push(streamPath(item.name));
      }}
    >
      <Image source={item.icon} style={styles.appListIcon} resizeMode="contain" />
      <View style={styles.appListInfo}>
        <ThemedText type="default" style={[styles.appListName, { fontWeight: '600', color: colors.text }]}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" style={styles.appListSub}>
          {item.sub}
        </ThemedText>
      </View>
      <View style={styles.appListBtn}>
        <ThemedText type="smallBold" style={{ color: '#007AFF' }}>
          OPEN
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Explore',
          headerShown: false,
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SafeAreaView edges={['top']} style={styles.header}>
          <View>
            <ThemedText type="smallBold" style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
            </ThemedText>
            <ThemedText type="title" style={styles.titleText}>
              Explore
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notifButton} onPress={() => setShowNotifs(true)}>
              <SymbolView name="bell.fill" size={22} tintColor={colors.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/settings')}>
              <ExpoImage source={require('../../../assets/images/avatar.png')} style={styles.avatar} contentFit="cover" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <FlatList
          data={FEATURED_COLLECTION as any}
          renderItem={renderFeatured as any}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          snapToInterval={width - Spacing.four * 2 + Spacing.three}
          decelerationRate="fast"
          keyExtractor={(item: any) => item.id}
        />

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Apps on AppStream
          </ThemedText>
          <TouchableOpacity>
            <ThemedText type="small" style={{ color: '#007AFF' }}>
              See All
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.appGridContainer}>
          <FlatList
            data={TOP_APPS as any}
            renderItem={renderAppListItem as any}
            scrollEnabled={false}
            keyExtractor={(item: any) => item.id}
            numColumns={1}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={showNotifs} animationType="slide" transparent onRequestClose={() => setShowNotifs(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowNotifs(false)} />
          <GlassCard style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIndicator} />
              <ThemedText type="subtitle" style={{ fontSize: 24, fontWeight: '700' }}>
                Alerts
              </ThemedText>
            </View>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              {NOTIFICATIONS.map((notif) => (
                <TouchableOpacity key={notif.id} style={styles.notifRow}>
                  <Image source={notif.appIcon} style={styles.notifAppIcon} />
                  <View style={styles.notifBody}>
                    <ThemedText type="default" style={{ fontWeight: '600', fontSize: 16 }}>
                      {notif.title}
                    </ThemedText>
                    <ThemedText type="small" style={{ opacity: 0.6 }}>
                      {notif.body}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: '#007AFF', fontSize: 11, marginTop: 4 }}>
                      {notif.time}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowNotifs(false)}>
              <ThemedText type="default" style={{ color: '#FFF', fontWeight: 'bold' }}>
                Close
              </ThemedText>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: 4 },
  dateText: { fontSize: 13, color: '#8E8E93', marginBottom: -4 },
  titleText: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  notifButton: { padding: 6, position: 'relative' },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'transparent' },
  profileButton: {},
  featuredList: { paddingLeft: Spacing.four, paddingRight: Spacing.four, paddingBottom: Spacing.four },
  featuredTouch: { width: width - Spacing.four * 2, marginRight: Spacing.three },
  featuredLabel: { color: '#007AFF', fontSize: 12, marginBottom: 2 },
  featuredName: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  featuredTagline: { opacity: 0.6, marginBottom: Spacing.two },
  featuredImage: {
    height: 420,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  featuredOverlay: { flex: 1, justifyContent: 'flex-end', padding: Spacing.three },
  featuredIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    gap: 12,
  },
  featuredIcon: { width: 44, height: 44, borderRadius: 10 },
  featuredIconText: { flex: 1, gap: 2 },
  featuredGetBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.four,
  },
  sectionTitle: { fontSize: 22, fontWeight: '700' },
  appGridContainer: { paddingHorizontal: Spacing.four },
  appListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  appListIcon: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F2F2F7' },
  appListInfo: { flex: 1 },
  appListName: { fontSize: 17 },
  appListSub: { opacity: 0.5, fontSize: 13 },
  appListBtn: { backgroundColor: '#F2F2F7', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  bottomSheet: {
    height: height * 0.7,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
  },
  sheetHeader: { alignItems: 'center', paddingVertical: 20, gap: 12 },
  sheetIndicator: { width: 40, height: 5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3 },
  sheetContent: { paddingHorizontal: Spacing.four, gap: 20 },
  notifRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  notifAppIcon: { width: 64, height: 64, borderRadius: 14 },
  notifBody: { flex: 1 },
  closeBtn: {
    backgroundColor: '#000',
    marginHorizontal: Spacing.four,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
});

