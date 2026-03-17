import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/glass-card';
import { Spacing } from '@/constants/theme';

const APP_BG_MAP: Record<string, any> = {
  'Genshin Impact': require('@/assets/images/apps/genshin_bg.png'),
  'Wuthering Waves': require('@/assets/images/apps/wuwa_bg.png'),
  'Zenless Zone Zero': require('@/assets/images/apps/zzz_bg.png'),
};

export default function StreamScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const appName = typeof id === 'string' ? id : 'App';
  
  const bgImage = APP_BG_MAP[appName] || require('@/assets/images/apps/genshin_bg.png'); // Fallback

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ImageBackground 
            source={bgImage} 
            style={StyleSheet.absoluteFill} 
            blurRadius={20}
        >
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <View style={styles.textStack}>
                    <ThemedText type="subtitle" style={styles.loadingText}>Initializing {appName}</ThemedText>
                    <ThemedText type="small" style={styles.subText}>Allocating Cloud HW: RTX 4090 vApp</ThemedText>
                </View>
                
                <GlassCard style={styles.loadingProgressCard}>
                    <View style={styles.progressRow}>
                        <ThemedText type="small" style={{ color: '#FFF' }}>Syncing State...</ThemedText>
                        <ThemedText type="small" style={{ color: '#007AFF' }}>78%</ThemedText>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '78%' }]} />
                    </View>
                </GlassCard>
            </View>
        </ImageBackground>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar hidden />
      <ImageBackground source={bgImage} style={styles.gameView}>
        <View style={styles.gameOverlay}>
            <View style={styles.topHud}>
                <GlassCard style={styles.statusChip}>
                    <View style={styles.statusDot} />
                    <ThemedText type="small" style={{ color: '#FFF', fontSize: 10 }}>LIVE STREAM • 14ms</ThemedText>
                </GlassCard>
            </View>
        </View>
      </ImageBackground>

      <GlassCard style={styles.controls}>
        <TouchableOpacity onPress={() => router.back()} style={styles.controlBtn}>
          <SymbolView name="xmark.circle.fill" size={32} tintColor="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.perfStats}>
          <ThemedText type="small" style={styles.perfText}>4K HDR • 60 FPS</ThemedText>
          <ThemedText type="small" style={[styles.perfText, { opacity: 0.5 }]}>Bitrate: 45 Mbps</ThemedText>
        </View>

        <View style={styles.rightActions}>
            <TouchableOpacity style={styles.controlBtn}>
                <SymbolView name="camera.viewfinder" size={28} tintColor="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn}>
                <SymbolView name="mic.fill" size={24} tintColor="#FFF" />
            </TouchableOpacity>
        </View>
      </GlassCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.five,
  },
  textStack: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  loadingText: {
    color: '#FFF',
    textAlign: 'center',
  },
  subText: {
    color: '#FFF',
    opacity: 0.6,
  },
  loadingProgressCard: {
    width: '100%',
    padding: Spacing.three,
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  gameView: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameOverlay: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  topHud: {
    flexDirection: 'row',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
  },
  perfStats: {
    alignItems: 'center',
  },
  perfText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  controlBtn: {
    padding: 4,
  },
});
