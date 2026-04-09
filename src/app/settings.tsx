import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions, useColorScheme, TextInput } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Colors } from '@/constants/theme';
import { getStreamUrl, setStreamUrl } from '@/utils/storage';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const themeMode = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[themeMode];

  const [url, setServerUrl] = useState('');

  useEffect(() => {
    getStreamUrl().then(setServerUrl);
  }, []);

  const handleUrlChange = (newUrl: string) => {
    setServerUrl(newUrl);
    setStreamUrl(newUrl);
  };

  const SettingItem = ({ icon, label, rightText, color = '#8E8E93', isLast = false, children }: any) => (
    <View style={styles.settingItem}>
      <View style={[styles.settingIconBg, { backgroundColor: color }]}>
        {/* @ts-ignore */}
        <SymbolView name={icon} size={16} tintColor="#FFFFFF" />
      </View>
      <View style={[styles.settingContent, isLast && { borderBottomWidth: 0 }]}>
        <View style={{ flex: 1 }}>
            <ThemedText type="default" style={styles.settingLabel}>{label}</ThemedText>
            {children}
        </View>
        <View style={styles.settingRight}>
          {rightText && <ThemedText type="default" style={styles.rightText}>{rightText}</ThemedText>}
          {/* @ts-ignore */}
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </View>
      </View>
    </View>
  );

  const StatRing = ({ icon, label, value, subValue, percentage, color }: any) => (
    <View style={[styles.statBox, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F2F2F7', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.02)' }]}>
        <View style={styles.statHeader}>
            <View style={[styles.statIconBadge, { backgroundColor: `${color}15` }]}>
                {/* @ts-ignore */}
                <SymbolView name={icon} size={14} tintColor={color} />
            </View>
            <ThemedText type="smallBold" style={{ color: color, fontSize: 13 }}>{percentage}%</ThemedText>
        </View>
        
        <View style={styles.statBody}>
            <ThemedText type="default" style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{value}</ThemedText>
            <ThemedText type="small" style={styles.statLabel} numberOfLines={1}>{label}</ThemedText>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        <ThemedText type="small" style={styles.statSub}>{subValue}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.headerBlur, { paddingTop: insets.top }]} />
      
      {/* Decorative Blur Blobs */}
      <View style={[styles.bgBlob, { top: -50, right: -100, backgroundColor: themeMode === 'dark' ? '#007AFF15' : '#007AFF08' }]} />

      {/* Top Navigation */}
      <View style={[styles.navBar, { top: insets.top }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.closeButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
            activeOpacity={0.7}
          >
              {/* @ts-ignore */}
              <SymbolView name="xmark" size={14} tintColor={themeMode === 'dark' ? '#FFF' : '#000'} />
          </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 60 }]}
      >
        <ThemedText type="title" style={styles.pageTitle}>Account</ThemedText>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
            <ExpoImage 
                source={require('../../assets/images/avatar.png')} 
                style={styles.profileAvatar}
            />
            <View style={styles.profileInfo}>
                <ThemedText type="subtitle" style={styles.profileName}>Om</ThemedText>
                <ThemedText type="default" style={styles.profileEmail}>om@appstream.online</ThemedText>
            </View>
            <View style={styles.proBadge}>
                <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
            </View>
        </View>

        {/* Server Configuration */}
        <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>SERVER CONFIGURATION</ThemedText>
        </View>
        <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.inputContainer}>
                <ThemedText type="small" style={styles.inputLabel}>Stream Server URL (Cloudflare/ngrok)</ThemedText>
                <TextInput 
                    style={[styles.textInput, { color: colors.text, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                    value={url}
                    onChangeText={handleUrlChange}
                    placeholder="https://..."
                    placeholderTextColor="#8E8E93"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>
        </View>

        {/* Premium Dark Dashboard for Rig Stats */}
        <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>CLOUD COMPUTE RIG</ThemedText>
        </View>
        
        <View style={[styles.rigDashboard, { backgroundColor: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={[styles.rigHeader, { borderBottomColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={styles.rigStatus}>
                    <View style={styles.statusDot} />
                    <ThemedText style={styles.statusText}>Instance Alpha-9 Connected</ThemedText>
                </View>
                {/* @ts-ignore */}
                <SymbolView name="server.rack" size={20} tintColor={colors.text} style={{ opacity: 0.5 }} />
            </View>

            <View style={styles.statsGrid}>
                <StatRing 
                    icon="memorychip" 
                    label="VRAM Usage" 
                    value="18.5 GB" 
                    subValue="RTX 4090 • 24GB"
                    color="#0A84FF" 
                    percentage={77} 
                />
                <StatRing 
                    icon="cpu" 
                    label="CPU Load" 
                    value="45%" 
                    subValue="AMD EPYC • 32C"
                    color="#BF5AF2" 
                    percentage={45} 
                />
                <StatRing 
                    icon="internaldrive.fill" 
                    label="NVMe I/O" 
                    value="2.4 GB/s" 
                    subValue="Read/Write"
                    color="#FF9F0A" 
                    percentage={60} 
                />
                <StatRing 
                    icon="network" 
                    label="Network" 
                    value="8.2 Gbps" 
                    subValue="10 Gbps Link"
                    color="#32D74B" 
                    percentage={82} 
                />
            </View>
        </View>

        {/* Grouped Settings */}
        <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>SUBSCRIPTIONS & BILLING</ThemedText>
        </View>
        <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
          <SettingItem icon="creditcard.fill" label="Payment Methods" rightText="Visa • 4242" color="#0A84FF" />
          <SettingItem icon="clock.fill" label="Streaming History" color="#5E5CE6" />
          <SettingItem icon="person.2.fill" label="Family Sharing" color="#FF375F" isLast />
        </View>

        <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>STREAMING ENGINE</ThemedText>
        </View>
        <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
          <SettingItem icon="antenna.radiowaves.left.and.right" label="Edge Node" rightText="US-EAST" color="#30D158" />
          <SettingItem icon="play.tv.fill" label="Video Quality" rightText="4K HDR" color="#FF9F0A" />
          <SettingItem icon="gamecontroller.fill" label="Input Latency" rightText="Ultra Low" color="#FF375F" isLast />
        </View>

        <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>APP PREFERENCES</ThemedText>
        </View>
        <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
          <SettingItem icon="bell.badge.fill" label="Notifications" color="#FF375F" />
          <SettingItem icon="moon.fill" label="Appearance" rightText="System" color="#5E5CE6" />
          <SettingItem icon="hand.raised.fill" label="Privacy & Security" color="#0A84FF" isLast />
        </View>

        {/* Footer */}
        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF' }]} activeOpacity={0.8}>
          <ThemedText type="default" style={styles.signOutText}>Sign Out of AppStream</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.versionText}>AppStream OS v3.0 (Build 890)</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 5,
  },
  bgBlob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.5,
  },
  navBar: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  proBadge: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  proBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rigDashboard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
  },
  rigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rigStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 215, 75, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#32D74B',
    shadowColor: '#32D74B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    color: '#32D74B',
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBody: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statSub: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  settingsGroup: {
    borderRadius: 12,
    marginBottom: 32,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  settingIconBg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '400',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  signOutBtn: {
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#8E8E93',
    fontSize: 12,
  },
  inputContainer: {
    padding: 16,
    gap: 8,
  },
  inputLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  textInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  }
});
