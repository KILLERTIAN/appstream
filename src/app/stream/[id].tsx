import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground, StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

import { GlassCard } from '@/components/glass-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getStreamUrl } from '@/utils/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const APP_CONFIG_MAP: Record<string, { bg: any }> = {
  'zomato': { bg: require('@/assets/images/apps/genshin_bg.png') },
  'swiggy': { bg: require('@/assets/images/apps/wuwa_bg.png') },
  'amazon': { bg: require('@/assets/images/apps/wuwa_bg.png') },
  'chess': { bg: require('@/assets/images/apps/zzz_bg.png') },
  'uno': { bg: require('@/assets/images/apps/genshin_bg.png') },
  'dominoz': { bg: require('@/assets/images/apps/wuwa_bg.png') },
  'default': { bg: require('@/assets/images/apps/zzz_bg.png') },
};

// ─── Optimized Stream Viewer ─────────────────────────────────────
// Instead of a plain WebView pointing to a VNC URL, we inject a
// custom ultra-lean H.264 WebSocket client that:
//   1. Receives raw H.264 frames from our server
//   2. Decodes them using the browser's native VideoDecoder API
//   3. Renders to a <canvas> with zero DOM overhead
//   4. Captures all touch events and sends them over a separate
//      low-latency WebSocket (avoids HTTP request overhead)

function buildStreamHTML(serverBaseUrl: string, appName: string) {
  let wsHost = serverBaseUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  // WKWebView commonly resolves "localhost" to IPv6 (::1). Our Node server binds IPv4
  // in many setups, so prefer 127.0.0.1 for simulator stability.
  wsHost = wsHost.replace(/^localhost(?=[:/]|$)/, '127.0.0.1');
  const wsProtocol = serverBaseUrl.startsWith('https') ? 'wss' : 'ws';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#000;touch-action:none}
    #screen{width:100%;height:100%;object-fit:cover;display:block;pointer-events:auto}
  </style>
</head>
<body>
  <img id="screen" />
  <script>
    // RN WebView bridge is sometimes not ready immediately on iOS.
    // Queue messages until the bridge becomes available.
    const __queue = [];
    function __postString(s) {
      // Primary bridge (react-native-webview)
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(s);
        return true;
      }
      // Fallback bridge (WKWebView message handler)
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ReactNativeWebView && window.webkit.messageHandlers.ReactNativeWebView.postMessage) {
        window.webkit.messageHandlers.ReactNativeWebView.postMessage(s);
        return true;
      }
      return false;
    }
    function __flush() {
      let ok = false;
      while (__queue.length) {
        const msg = __queue[0];
        try {
          ok = __postString(JSON.stringify(msg));
          if (!ok) return false;
          __queue.shift();
        } catch (e) {
          return false;
        }
      }
      return ok;
    }
    function post(msg) {
      try {
        __queue.push(msg);
        __flush();
      } catch (e) {}
    }
    setInterval(__flush, 250);

    window.addEventListener('error', (e) => {
      post({ type: 'log', level: 'error', msg: 'window.error', detail: String(e && (e.message || e.error || e)) });
    });
    window.addEventListener('unhandledrejection', (e) => {
      post({ type: 'log', level: 'error', msg: 'unhandledrejection', detail: String(e && (e.reason || e)) });
    });

    const screen = document.getElementById('screen');
    let deviceW = 1080, deviceH = 1920;
    let frameCount = 0, lastFpsTime = Date.now(), totalBytes = 0;
    let pendingFrame = null;
    let rendering = false;
    let lastObjectUrl = null;
    let firstFrameShown = false;
    let firstFrameReceived = false;
    post({ type: 'log', level: 'info', msg: 'html_loaded', wsHost: '${wsHost}', wsProtocol: '${wsProtocol}', appName: '${appName}' });

    screen.addEventListener('load', () => {
      if (!firstFrameShown) {
        firstFrameShown = true;
        post({ type: 'ready' });
      }
    });

    // ── Render latest frame, drop older ones ──
    function renderFrame(data) {
      pendingFrame = data;
      if (rendering) return; // Skip — will pick up pendingFrame when current render finishes
      rendering = true;

      function doRender() {
        if (!pendingFrame) { rendering = false; return; }
        const frameData = pendingFrame;
        pendingFrame = null;

        // Use blob/objectURL to avoid expensive base64 conversion per frame.
        // This is significantly smoother in RN WebView on iOS/Android.
        try {
          // Server may send JPEG (fast path) or PNG (fallback path).
          const u8 = new Uint8Array(frameData);
          const isPng = u8.length >= 8 &&
            u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47 &&
            u8[4] === 0x0D && u8[5] === 0x0A && u8[6] === 0x1A && u8[7] === 0x0A;
          const mime = isPng ? 'image/png' : 'image/jpeg';
          const blob = new Blob([frameData], { type: mime });
          if (URL && URL.createObjectURL) {
            const url = URL.createObjectURL(blob);
            if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
            lastObjectUrl = url;
            screen.src = url;
          } else {
            throw new Error('URL.createObjectURL not available');
          }
        } catch (e) {
          // Fallback: base64 data URL (slower, but more compatible with WKWebView)
          try {
            const u8 = new Uint8Array(frameData);
            const isPng = u8.length >= 8 &&
              u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47 &&
              u8[4] === 0x0D && u8[5] === 0x0A && u8[6] === 0x1A && u8[7] === 0x0A;
            const mime = isPng ? 'image/png' : 'image/jpeg';

            let binary = '';
            for (let i = 0; i < u8.length; i += 8192) {
              binary += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
            }
            const base64 = btoa(binary);
            if (lastObjectUrl) { try { URL.revokeObjectURL(lastObjectUrl); } catch (_) {} }
            lastObjectUrl = null;
            screen.src = 'data:' + mime + ';base64,' + base64;
          } catch (e2) {
            post({ type: 'log', level: 'error', msg: 'renderFrame_failed', detail: String(e) + ' | ' + String(e2) });
          }
        }

        // Use requestAnimationFrame to sync with display refresh
        requestAnimationFrame(() => {
          if (pendingFrame) {
            doRender(); // New frame arrived during render, show it immediately
          } else {
            rendering = false;
          }
        });
      }
      doRender();
    }

    // ── Video WebSocket ──
    function connectVideo() {
      const ws = new WebSocket('${wsProtocol}://${wsHost}/video');
      ws.binaryType = 'arraybuffer';
      post({ type: 'log', level: 'info', msg: 'video_ws_connecting' });

      ws.onopen = () => post({ type: 'log', level: 'info', msg: 'video_ws_open' });
      ws.onmessage = (evt) => {
        if (typeof evt.data === 'string') {
          try {
            const cfg = JSON.parse(evt.data);
            if (cfg.type === 'config') {
              deviceW = cfg.width;
              deviceH = cfg.height;
              post({ type: 'log', level: 'info', msg: 'video_config', width: deviceW, height: deviceH });
            }
          } catch(e) {}
        } else {
          if (!firstFrameReceived) {
            firstFrameReceived = true;
            post({ type: 'ready' });
            post({ type: 'log', level: 'info', msg: 'first_frame_received' });
          }
          frameCount++;
          totalBytes += evt.data.byteLength;
          renderFrame(evt.data);

          const now = Date.now();
          if (now - lastFpsTime >= 2000) {
            const fps = Math.round(frameCount * 1000 / (now - lastFpsTime));
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'stats', fps, kbps: Math.round(totalBytes * 8 / (now - lastFpsTime))
            }));
            frameCount = 0; totalBytes = 0; lastFpsTime = now;
          }
        }
      };

      ws.onclose = () => {
        post({ type: 'log', level: 'warn', msg: 'video_ws_close' });
        setTimeout(connectVideo, 2000);
      };
      ws.onerror = (e) => {
        post({ type: 'log', level: 'error', msg: 'video_ws_error', detail: (e && (e.message || e.type)) ? String(e.message || e.type) : String(e) });
        ws.close();
      };
    }

    // ── Input WebSocket ──
    let inputWs;
    let launchSent = false;
    function connectInput() {
      inputWs = new WebSocket('${wsProtocol}://${wsHost}/input');
      inputWs.onopen = () => {
        post({ type: 'log', level: 'info', msg: 'input_ws_open' });
        // Auto-launch the app when connection is established
        if (!launchSent && '${appName}') {
          launchSent = true;
          inputWs.send(JSON.stringify({ type: 'launch', appName: '${appName}' }));
          post({ type: 'log', level: 'info', msg: 'launch_sent', appName: '${appName}' });
        }
      };
      inputWs.onclose = () => {
        post({ type: 'log', level: 'warn', msg: 'input_ws_close' });
        setTimeout(connectInput, 2000);
      };
      inputWs.onerror = (e) => {
        post({ type: 'log', level: 'error', msg: 'input_ws_error', detail: (e && (e.message || e.type)) ? String(e.message || e.type) : String(e) });
        inputWs.close();
      };
    }

    function sendInput(msg) {
      if (inputWs && inputWs.readyState === 1) inputWs.send(JSON.stringify(msg));
    }

    // ── Touch Handling ──
    let startPos = null, startTime = 0;

    function getCoords(e) {
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const r = screen.getBoundingClientRect();
      return {
        x: Math.round(((t.clientX - r.left) / r.width) * deviceW),
        y: Math.round(((t.clientY - r.top) / r.height) * deviceH)
      };
    }

    screen.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startPos = getCoords(e);
      startTime = Date.now();
    }, { passive: false });

    screen.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!startPos) return;
      const end = getCoords(e);
      const dx = Math.abs(end.x - startPos.x), dy = Math.abs(end.y - startPos.y);
      const elapsed = Date.now() - startTime;

      if (dx < 30 && dy < 30) {
        sendInput(elapsed > 500
          ? { type: 'longpress', x: end.x, y: end.y }
          : { type: 'tap', x: end.x, y: end.y });
      } else {
        sendInput({ type: 'swipe', x1: startPos.x, y1: startPos.y, x2: end.x, y2: end.y, duration: Math.min(elapsed, 1000) });
      }
      startPos = null;
    }, { passive: false });

    // Desktop pointer fallback
    screen.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      const r = screen.getBoundingClientRect();
      sendInput({
        type: 'tap',
        x: Math.round(((e.clientX - r.left) / r.width) * deviceW),
        y: Math.round(((e.clientY - r.top) / r.height) * deviceH)
      });
    });

    connectVideo();
    connectInput();
  </script>
</body>
</html>`;
}

export default function StreamScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamHtml, setStreamHtml] = useState('');
  const [liveStats, setLiveStats] = useState({ fps: 0, kbps: 0 });
  const [connectionError, setConnectionError] = useState('');
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewRef = useRef<WebView>(null);

  const appName = typeof id === 'string' ? id.toLowerCase() : 'default';
  const config = APP_CONFIG_MAP[appName] || APP_CONFIG_MAP['default'];

  const pushDebug = useCallback((line: string) => {
    console.log(`[StreamDebug:${appName}]`, line);
    setDebugLines((prev) => {
      const next = [...prev, `${new Date().toLocaleTimeString()} ${line}`];
      return next.slice(-25);
    });
  }, [appName]);

  const connectToServer = useCallback(async () => {
    setConnectionError('');
    setLoading(true);
    pushDebug(`[nav] stream/${String(id)} → appName=${appName}`);
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }

    const url = await getStreamUrl();
    setStreamUrl(url);
    pushDebug(`[url] ${url}`);

    // Pre-check: Can we reach the server?
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      pushDebug(`[health] GET ${url}/health`);
      const resp = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await resp.json();
      pushDebug(`[health] ${resp.status} ${JSON.stringify(data)}`);

      if (data.status === 'ok') {
        // Server is reachable — launch the app and start streaming
        pushDebug(`[launch] POST ${url}/launch appName=${appName}`);
        fetch(`${url}/launch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appName }),
        }).catch((e) => pushDebug(`[launch] failed: ${String(e)}`)); // Fire and forget

        setStreamHtml(buildStreamHTML(url, appName));
        pushDebug(`[webview] html injected`);
        // Wait for first frame; if we never get one, show a helpful error.
        readyTimeoutRef.current = setTimeout(() => {
          setConnectionError(
            `Connected to server, but no video frames arrived.\n\nCheck:\n• Android emulator/device is visible/unlocked\n• ADB works (adb devices)\n• ffmpeg is installed\n• Server logs show frames`
          );
          pushDebug(`[timeout] no first frame within 30s`);
          setLoading(false);
        }, 30000);
      } else {
        setConnectionError(`Server responded but not ready`);
        pushDebug(`[health] not ok`);
        setLoading(false);
      }
    } catch (e: any) {
      const msg = String(e?.message || e);
      pushDebug(`[health] failed: ${msg}`);
      setConnectionError(
        `Can't reach server at ${url}\n\nError:\n${msg}\n\nMake sure:\n• Stream server is running\n• Phone is on same WiFi\n• URL is correct (not localhost)\n• iOS HTTP blocked? (try https/ngrok)`
      );
      setLoading(false);
    }
  }, [appName, id, pushDebug]);

  useEffect(() => {
    connectToServer();
  }, []);

  const toggleControls = useCallback(() => {
    const newValue = !showControls;
    setShowControls(newValue);
    Animated.timing(controlsOpacity, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showControls]);

  // Handle messages from injected JS (live stats)
  const onWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        if (readyTimeoutRef.current) {
          clearTimeout(readyTimeoutRef.current);
          readyTimeoutRef.current = null;
        }
        pushDebug(`[video] first frame rendered`);
        setLoading(false);
        return;
      }
      if (data.type === 'stats') {
        setLiveStats({ fps: data.fps, kbps: data.kbps });
        return;
      }
      if (data.type === 'log') {
        const detail = data.detail ? ` ${data.detail}` : '';
        pushDebug(`[wv:${data.level || 'info'}] ${data.msg || 'log'}${detail}`);
      }
    } catch (e) { }
  }, [pushDebug]);

  // ── Render: Always mount WebView behind overlays so it can connect ──
  return (
    <ThemedView style={styles.container}>
      <StatusBar hidden={true} />

      {/* WebView renders hidden behind overlays once streamHtml is ready */}
      {streamHtml ? (
        <View style={StyleSheet.absoluteFill}>
          <WebView
            ref={webViewRef}
            source={{ html: streamHtml, baseUrl: streamUrl }}
            style={styles.webView}
            originWhitelist={['*']}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            mixedContentMode="always"
            allowsBackForwardNavigationGestures={false}
            cacheEnabled={false}
            overScrollMode="never"
            onMessage={onWebViewMessage}
            onError={(e) => pushDebug(`[webview] onError ${String(e?.nativeEvent?.description || '')}`)}
            onHttpError={(e) => pushDebug(`[webview] onHttpError ${String(e?.nativeEvent?.statusCode || '')}`)}
            onLoadStart={() => pushDebug(`[webview] loadStart`)}
            onLoadEnd={() => {
              pushDebug(`[webview] loadEnd`);
              webViewRef.current?.injectJavaScript(`
                (function(){
                  try {
                    var msg = JSON.stringify({ type: 'log', level: 'info', msg: 'rn_injected_ping' });
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      window.ReactNativeWebView.postMessage(msg);
                    } else if (window.webkit && window.webkit.messageHandlers) {
                      var h = window.webkit.messageHandlers.ReactNativeWebView || window.webkit.messageHandlers.reactNativeWebView;
                      if (h && h.postMessage) h.postMessage(msg);
                    }
                  } catch (e) {}
                })();
                true;
              `);
            }}
          />
        </View>
      ) : null}

      {/* Loading overlay — shown on top of WebView while waiting for first frame */}
      {loading && (
        <View style={StyleSheet.absoluteFill}>
          <ImageBackground
            source={config.bg}
            style={StyleSheet.absoluteFill}
            blurRadius={20}
          >
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <View style={styles.textStack}>
                <ThemedText type="subtitle" style={styles.loadingText}>Initializing {appName}</ThemedText>
                <ThemedText type="small" style={styles.subText}>Allocating Cloud HW: RTX 4090 vApp</ThemedText>
                {streamUrl ? (
                  <ThemedText type="small" style={[styles.subText, { textAlign: 'center' }]}>
                    {streamUrl}
                  </ThemedText>
                ) : null}
              </View>

              <GlassCard style={styles.loadingProgressCard}>
                <View style={styles.progressRow}>
                  <ThemedText type="small" style={{ color: '#FFF' }}>Syncing State...</ThemedText>
                  <ThemedText type="small" style={{ color: '#007AFF' }}>92%</ThemedText>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '92%' }]} />
                </View>
              </GlassCard>
            </View>
          </ImageBackground>
        </View>
      )}

      {/* Error overlay */}
      {connectionError ? (
        <View style={StyleSheet.absoluteFill}>
          <ImageBackground source={config.bg} style={StyleSheet.absoluteFill} blurRadius={40}>
            <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
              <SymbolView name="wifi.slash" size={48} tintColor="#FF3B30" />
              <View style={styles.textStack}>
                <ThemedText type="subtitle" style={{ color: '#FF3B30' }}>Connection Failed</ThemedText>
                <ThemedText type="default" style={[styles.subText, { textAlign: 'center', paddingHorizontal: 40 }]}>
                  {connectionError}
                </ThemedText>
              </View>

              {debugLines.length ? (
                <GlassCard style={[styles.loadingProgressCard, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                  {debugLines.slice(-8).map((l, idx) => (
                    <ThemedText key={idx} type="small" style={{ color: '#FFF', opacity: 0.75 }}>
                      {l}
                    </ThemedText>
                  ))}
                </GlassCard>
              ) : null}

              <TouchableOpacity style={styles.retryBtn} onPress={connectToServer}>
                <ThemedText type="default" style={{ color: '#FFF', fontWeight: 'bold' }}>RETRY CONNECTION</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
                <ThemedText type="small" style={{ color: '#FFF', opacity: 0.5 }}>Go Back</ThemedText>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      ) : null}

      {/* HUD Overlay — only when stream is active (not loading, no error) */}
      {!loading && !connectionError && (
        <View style={styles.overlayTouch} pointerEvents="box-none">
          {/* Subtle Back Button for native feel without heavy UI */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ position: 'absolute', top: 20, right: 20, padding: 10, zIndex: 100 }}
          >
            <SymbolView name="xmark.circle.fill" size={24} tintColor="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>
      )}
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
  retryBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  streamContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topHud: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  controlsInner: {
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
