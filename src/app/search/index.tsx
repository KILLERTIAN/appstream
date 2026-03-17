import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, Dimensions, useColorScheme, ScrollView, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/glass-card';
import { Spacing, Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

const BROWSE_CATEGORIES = [
  { id: 'c1', title: 'Top Downloaded\nApps', color: '#007AFF', icon: 'arrow.down.circle.fill' },
  { id: 'c2', title: 'Top Downloaded\nGames', color: '#FF9500', icon: 'gamecontroller.fill' },
  { id: 'c3', title: 'Top-Selling\nApps', color: '#34C759', icon: 'star.fill' },
  { id: 'c4', title: 'Top-Selling\nGames', color: '#5856D6', icon: 'crown.fill' },
  { id: 'c5', title: 'Productivity', color: '#5AC8FA', icon: 'paperplane.fill' },
  { id: 'c6', title: 'Action Games', color: '#FF3B30', icon: 'flame.fill' },
];

const SUGGESTED_APPS = [
  { id: 's1', name: 'Google Gemini', sub: 'Your AI assistant', icon: require('@/assets/images/apps/gemini.png'), ad: true },
  { id: 's2', name: 'Spotify', sub: 'Music for everyone', icon: require('@/assets/images/apps/spotify.png') },
  { id: 's3', name: 'CapCut', sub: 'Video Editor & Maker', icon: require('@/assets/images/apps/capcut.png') },
  { id: 's4', name: 'Instagram', sub: 'Share your moments', icon: require('@/assets/images/apps/instagram.png') },
  { id: 's5', name: 'Zoom', sub: 'Meetings & Chat', icon: require('@/assets/images/apps/zoom.png') },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const themeMode = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[themeMode];

  useEffect(() => {
    if (query.length > 2) {
      const searchApps = async () => {
        setLoading(true);
        try {
          const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=20`);
          const data = await response.json();
          setResults(data.results || []);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setLoading(false);
        }
      };
      const debounce = setTimeout(searchApps, 500);
      return () => clearTimeout(debounce);
    } else {
      setResults([]);
    }
  }, [query]);

  const renderAppItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.appItem} onPress={() => {}}>
        <Image source={{ uri: item.artworkUrl60 }} style={styles.appIcon} resizeMode="contain" />
        <View style={styles.appInfo}>
            <ThemedText type="default" style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
              {item.trackName}
            </ThemedText>
            <ThemedText type="small" numberOfLines={1} style={styles.appSub}>{item.primaryGenreName} • {item.sellerName}</ThemedText>
        </View>
        <TouchableOpacity style={styles.appBtn}>
            <ThemedText type="smallBold" style={{ color: '#007AFF' }}>OPEN</ThemedText>
        </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Official search bar integration into the tab bar */}
      <Stack.Screen 
        options={{
          headerShown: true,
          title: '', // Prevents 'index' word from showing
          headerTransparent: true,
          headerSearchBarOptions: {
            placeholder: 'Games, Apps, and More',
            onChangeText: (event) => setQuery(event.nativeEvent.text),
            hideWhenScrolling: false,
          },
        }} 
      />
      
      <FlatList
        data={results}
        renderItem={renderAppItem}
        keyExtractor={(item) => item.trackId?.toString() || Math.random().toString()}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          !query ? (
            <View style={styles.suggestionsContainer}>
                {/* Manual Title Area */}
                <View style={styles.header}>
                   <ThemedText type="title" style={[styles.pageTitle, { color: colors.text }]}>Search</ThemedText>
                </View>

                <View style={styles.sectionHeader}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Suggested</ThemedText>
                    {/* @ts-ignore */}
                    <SymbolView name="chevron.right" size={16} tintColor="#8E8E93" />
                </View>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.horizontalScroll}
                  decelerationRate="fast"
                  snapToInterval={width * 0.88 + 12}
                >
                    {SUGGESTED_APPS.map(app => (
                        <TouchableOpacity key={app.id} activeOpacity={0.9} style={styles.suggestedCardContainer}>
                            <GlassCard style={styles.suggestedCard}>
                                <View style={styles.suggestedContent}>
                                    <Image source={app.icon} style={styles.suggestedIcon} />
                                    <View style={styles.suggestedInfo}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <ThemedText type="default" style={{ fontWeight: '700', fontSize: 17 }} numberOfLines={1}>
                                              {app.name}
                                            </ThemedText>
                                        </View>
                                        <ThemedText type="small" numberOfLines={1} style={{ opacity: 0.5, fontSize: 13 }}>
                                          {app.sub}
                                        </ThemedText>
                                        {app.ad && <View style={styles.adTag}><ThemedText style={styles.adTagText}>Ad</ThemedText></View>}
                                    </View>
                                    <View style={styles.suggestedAction}>
                                      <TouchableOpacity style={styles.suggestedGetBtn}>
                                        <ThemedText type="smallBold" style={{ color: '#007AFF' }}>GET</ThemedText>
                                      </TouchableOpacity>
                                      <ThemedText type="small" style={styles.inAppText}>In-App Purchases</ThemedText>
                                    </View>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Browse All Categories</ThemedText>
                    {/* @ts-ignore */}
                    <SymbolView name="chevron.right" size={16} tintColor="#8E8E93" />
                </View>

                <View style={styles.browseGrid}>
                    {BROWSE_CATEGORIES.map(cat => (
                        <TouchableOpacity key={cat.id} activeOpacity={0.8} style={[styles.browseCard, { backgroundColor: cat.color }]}>
                            <ThemedText style={styles.browseCardTitle}>{cat.title}</ThemedText>
                            <View style={styles.browseIconContainer}>
                                {/* @ts-ignore */}
                                <SymbolView name={cat.icon} size={42} tintColor="rgba(255,255,255,0.25)" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
          ) : loading ? (
            <View style={{ padding: 40 }}><ActivityIndicator color="#007AFF" /></View>
          ) : null
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
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 180,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  horizontalScroll: {
    paddingRight: Spacing.four,
    gap: 12,
    paddingVertical: 4,
  },
  suggestedCardContainer: {
    width: width * 0.88,
    marginRight: 12,
  },
  suggestedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  suggestedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestedIcon: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  suggestedInfo: {
    flex: 1,
    gap: 1,
  },
  suggestedAction: {
    alignItems: 'center',
    gap: 4,
  },
  inAppText: {
    fontSize: 8,
    opacity: 0.4,
    fontWeight: '500',
  },
  adTag: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  adTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007AFF',
  },
  suggestedGetBtn: {
    backgroundColor: '#F0F0F7',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 18,
    minWidth: 68,
    alignItems: 'center',
  },
  browseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  browseCard: {
    width: (width - Spacing.four * 2 - 12) / 2,
    height: 110,
    borderRadius: 18,
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  browseCardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  browseIconContainer: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    transform: [{ rotate: '-12deg' }],
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
  },
  appInfo: {
    flex: 1,
  },
  appSub: {
    opacity: 0.5,
    fontSize: 13,
  },
  appBtn: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  }
});
