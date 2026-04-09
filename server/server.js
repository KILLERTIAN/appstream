/**
 * AppStream Server v3 — 30+ FPS Android Screen Streaming + Touch Input
 * 
 * Engine: screenrecord (H.264) → FFmpeg (decode → MJPEG) → WebSocket
 * This captures from Android's SurfaceFlinger at native refresh rate.
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { spawn, exec, execSync } = require('child_process');
const cors = require('cors');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
const CAPTURE_SCALE = 720;        // Smaller = faster encoding + transfer
const CAPTURE_BITRATE = '4000000'; // 4 Mbps — good balance for 480p
const JPEG_QUALITY = '12';        // Lower quality = smaller frames = less WiFi lag
const TARGET_FPS = '30';          // Target output FPS

// ─── App Package Mapping ─────────────────────────────────────────
// Maps friendly app names (from Expo UI) → Android package names
const APP_PACKAGES = {
  'zomato': 'com.application.zomato',
  'instagram': 'com.instagram.android',
  'whatsapp': 'com.whatsapp',
  'spotify': 'com.spotify.music',
  'tiktok': 'com.zhiliaoapp.musically',
  'roblox': 'com.roblox.client',
  'capcut': 'com.lemon.lvoverseas',
  'slack': 'com.Slack',
  'youtube': 'com.google.android.youtube',
  'twitter': 'com.twitter.android',
  'snapchat': 'com.snapchat.android',
  'telegram': 'org.telegram.messenger',
  'netflix': 'com.netflix.mediaclient',
  'chrome': 'com.android.chrome',
  'genshin impact': 'com.miHoYo.GenshinImpact',
  'wuthering waves': 'com.kurogame.wutheringwaves.global',
  'zenless zone zero': 'com.HoYoverse.Nap',
  'dominoz': 'com.Dominos',
  'dominos': 'com.Dominos',
  'clash of clans': 'com.supercell.clashofclans',
};

// ─── Express ─────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', streaming: !!captureProcess, clients: clientCount, method: currentMethod });
});

// ─── Web Viewer (Drag-to-Swipe & Touch) ──────────────────────────
// ─── Web Viewer (Embeddable) ──────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AppStream Feed</title>
      <style>
        body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
        #container { position: relative; cursor: crosshair; }
        #stream { display: block; max-width: 100vw; max-height: 100vh; }
      </style>
    </head>
    <body>
      <div id="container">
        <img id="stream" src="" alt="Stream" draggable="false">
      </div>

      <script>
        const img = document.getElementById('stream');
        const container = document.getElementById('container');
        
        const videoWs = new WebSocket('ws://' + location.host + '/video');
        const inputWs = new WebSocket('ws://' + location.host + '/input');

        videoWs.onmessage = (e) => {
          const url = URL.createObjectURL(e.data);
          const old = img.src; img.src = url; if(old) URL.revokeObjectURL(old);
        };

        let down = false, sX, sY, sT;
        img.ondragstart = () => false;

        container.onmousedown = (e) => {
          if (e.button !== 0) return;
          down = true; sT = Date.now();
          const r = img.getBoundingClientRect();
          sX = (e.clientX - r.left) / r.width; sY = (e.clientY - r.top) / r.height;
          e.preventDefault();
        };

        window.onmouseup = (e) => {
          if (!down) return; down = false;
          const r = img.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          const dist = Math.sqrt(Math.pow(x-sX,2) + Math.pow(y-sY,2));
          if (dist < 0.01) {
            inputWs.send(JSON.stringify({ type: 'tap', x: sX, y: sY }));
          } else {
            inputWs.send(JSON.stringify({ type: 'swipe', x1: sX, y1: sY, x2: x, y2: y, duration: Math.max(Date.now()-sT, 150) }));
          }
        };
      </script>
    </body>
    </html>
  `);
});

// ── List installed apps on the device ──
app.get('/apps', (req, res) => {
  exec('adb shell pm list packages -3', (err, stdout) => {
    if (err) return res.status(500).json({ error: 'Failed to list apps' });
    const packages = stdout.trim().split('\n')
      .map(line => line.replace('package:', '').trim())
      .filter(Boolean);
    res.json({ packages, mapped: APP_PACKAGES });
  });
});

// ── Launch an app on the device ──
app.post('/launch', (req, res) => {
  const { appName, packageName } = req.body;
  const pkg = packageName || APP_PACKAGES[(appName || '').toLowerCase()];

  if (!pkg) {
    return res.status(400).json({
      error: `Unknown app: ${appName}`,
      hint: 'Send { packageName: "com.example.app" } or add to APP_PACKAGES map',
      available: Object.keys(APP_PACKAGES),
    });
  }

  console.log(`[LAUNCH] Opening ${pkg}...`);

  // Use monkey to launch — works even without knowing the main activity
  exec(`adb shell monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`, (err, stdout, stderr) => {
    if (stderr && stderr.includes('No activities found')) {
      return res.status(404).json({ error: `App not installed: ${pkg}` });
    }
    res.json({ ok: true, package: pkg });
  });
});

// ── REST touch API (fallback) ──
app.post('/input/tap', (req, res) => {
  const { x, y } = req.body;
  if (x == null || y == null) return res.status(400).json({ error: 'x,y required' });
  exec(`adb shell input tap ${Math.round(x)} ${Math.round(y)}`);
  res.json({ ok: true });
});

app.post('/input/swipe', (req, res) => {
  const { x1, y1, x2, y2, duration = 300 } = req.body;
  exec(`adb shell input swipe ${Math.round(x1)} ${Math.round(y1)} ${Math.round(x2)} ${Math.round(y2)} ${duration}`);
  res.json({ ok: true });
});

app.post('/input/keyevent', (req, res) => {
  const { keycode } = req.body;
  exec(`adb shell input keyevent ${keycode}`);
  res.json({ ok: true });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'client.html')));

// ─── HTTP + WebSocket Server ─────────────────────────────────────
const server = http.createServer(app);
const videoWss = new WebSocketServer({ noServer: true });
const inputWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (pathname === '/video') {
    videoWss.handleUpgrade(req, socket, head, (ws) => videoWss.emit('connection', ws, req));
  } else if (pathname === '/input') {
    inputWss.handleUpgrade(req, socket, head, (ws) => inputWss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

// ─── State ───────────────────────────────────────────────────────
let captureProcess = null;
let clientCount = 0;
let currentMethod = 'none';
let deviceWidth = 1080;
let deviceHeight = 1920;

function getDeviceSize() {
  try {
    const output = execSync('adb shell wm size').toString();
    const match = output.match(/(\d+)x(\d+)/);
    if (match) {
      deviceWidth = parseInt(match[1]);
      deviceHeight = parseInt(match[2]);
      console.log(`[DEVICE] Screen: ${deviceWidth}x${deviceHeight}`);
    }
  } catch (e) {
    console.log('[DEVICE] Could not get screen size, using defaults');
  }
}

// ─── Video Broadcasting ──────────────────────────────────────────
videoWss.on('connection', (ws) => {
  clientCount++;
  console.log(`[VIDEO] Client connected (${clientCount} total)`);

  ws.send(JSON.stringify({
    type: 'config',
    width: deviceWidth,
    height: deviceHeight,
    fps: parseInt(TARGET_FPS),
  }));

  ws.on('close', () => {
    clientCount--;
    console.log(`[VIDEO] Client disconnected (${clientCount} remaining)`);
    if (clientCount === 0) stopCapture();
  });

  if (!captureProcess) startCapture();
});

// ─── Input Handling (Ultra-Responsive) ───────────────────────────
// We use a persistent adb shell to avoid process spawn overhead (~100ms)
const adbShell = spawn('adb', ['shell'], { stdio: ['pipe', 'pipe', 'pipe'] });
adbShell.stdin.setEncoding('utf-8');

function sendAdbCommand(cmd) {
  adbShell.stdin.write(cmd + '\n');
}

inputWss.on('connection', (ws) => {
  console.log('[INPUT] Client connected');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Auto-scaling helper: Scales 0-1 to screen px, or uses raw px if > 1
      const sX = (v) => v <= 1 ? Math.round(v * deviceWidth) : Math.round(v);
      const sY = (v) => v <= 1 ? Math.round(v * deviceHeight) : Math.round(v);

      switch (msg.type) {
        case 'tap':
        case 'touch':
          sendAdbCommand(`input tap ${sX(msg.x)} ${sY(msg.y)}`);
          break;
        case 'swipe':
          sendAdbCommand(`input swipe ${sX(msg.x1)} ${sY(msg.y1)} ${sX(msg.x2)} ${sY(msg.y2)} ${msg.duration || 250}`);
          break;
        case 'longpress':
          sendAdbCommand(`input swipe ${sX(msg.x)} ${sY(msg.y)} ${sX(msg.x)} ${sY(msg.y)} 800`);
          break;
        case 'keyevent':
          sendAdbCommand(`input keyevent ${msg.keycode || msg.keyCode}`);
          break;
        case 'text':
          const safe = msg.text.replace(/'/g, "");
          sendAdbCommand(`input text '${safe}'`);
          break;
        case 'back': sendAdbCommand('input keyevent 4'); break;
        case 'home': sendAdbCommand('input keyevent 3'); break;
        case 'recents': sendAdbCommand('input keyevent 187'); break;
      }
    } catch (e) {
      console.error('[INPUT] Error:', e.message);
    }
  });

  ws.on('close', () => console.log('[INPUT] Client disconnected'));
});

// ─── Capture Engine (30+ FPS) ────────────────────────────────────
// Uses `screenrecord --output-format=h264` which hooks into Android's
// SurfaceFlinger at native refresh rate (30-60 FPS).
// Pipeline: screenrecord (H.264) → FFmpeg (decode → MJPEG) → frame split → WS

function startScreenRecordPipeline() {
  console.log('[CAPTURE] ✓ Using screenrecord → FFmpeg pipeline (30+ FPS target)');
  currentMethod = 'screenrecord';

  let running = true;
  let totalFrames = 0;
  const startTime = Date.now();

  function launchPipeline() {
    if (!running || clientCount === 0) {
      captureProcess = null;
      currentMethod = 'none';
      console.log('[CAPTURE] Stopped (no clients)');
      return;
    }

    // Compute even dimensions (H.264 encoders require even width/height)
    const scaledW = Math.round(CAPTURE_SCALE / 2) * 2;
    const scaledH = Math.round((scaledW * (deviceHeight / deviceWidth)) / 2) * 2;
    console.log(`[CAPTURE] Resolution: ${scaledW}x${scaledH}`);

    // Step 1: Continuous H.264 from Android's display compositor
    const adb = spawn('adb', [
      'exec-out', 'screenrecord',
      '--output-format=h264',
      '--size', `${scaledW}x${scaledH}`,
      '--bit-rate', CAPTURE_BITRATE,
      '-',
    ]);

    // Step 2: FFmpeg decodes H.264 → outputs MJPEG stream
    const ffmpeg = spawn('ffmpeg', [
      '-probesize', '5000000',     // 5MB — reliable H.264 detection
      '-i', 'pipe:0',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-q:v', JPEG_QUALITY,        // Lower quality = smaller frames
      '-an',                       // Skip audio processing
      'pipe:1',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    adb.stdout.pipe(ffmpeg.stdin);

    // Step 3: Split continuous MJPEG into individual JPEG frames
    let buffer = Buffer.alloc(0);
    const SOI = Buffer.from([0xFF, 0xD8]);
    const EOI = Buffer.from([0xFF, 0xD9]);

    ffmpeg.stdout.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      // Extract all complete JPEG frames
      while (true) {
        const soiIdx = buffer.indexOf(SOI);
        if (soiIdx === -1) break;

        const eoiIdx = buffer.indexOf(EOI, soiIdx + 2);
        if (eoiIdx === -1) break;

        const frame = buffer.subarray(soiIdx, eoiIdx + 2);
        buffer = buffer.subarray(eoiIdx + 2);

        totalFrames++;
        if (totalFrames <= 5) {
          console.log(`[CAPTURE] Frame #${totalFrames}: ${(frame.length / 1024).toFixed(0)} KB`);
        }

        // Broadcast to all connected viewers
        videoWss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(frame);
          }
        });
      }

      // Safety: prevent memory leak
      if (buffer.length > 2 * 1024 * 1024) {
        buffer = buffer.subarray(buffer.length - 256 * 1024);
      }
    });

    ffmpeg.stderr.on('data', () => { }); // Suppress FFmpeg logs

    // Auto-restart when screenrecord hits 3-minute limit
    adb.on('close', (code) => {
      console.log(`[CAPTURE] screenrecord cycle ended (code ${code}), restarting...`);
      setTimeout(() => {
        if (running && clientCount > 0) launchPipeline();
      }, 50);
    });

    ffmpeg.on('close', () => { });
    adb.on('error', (err) => console.error('[CAPTURE] ADB error:', err.message));
    ffmpeg.on('error', (err) => console.error('[CAPTURE] FFmpeg error:', err.message));

    captureProcess = {
      kill: () => {
        running = false;
        try { adb.kill('SIGTERM'); } catch (e) { }
        try { ffmpeg.kill('SIGTERM'); } catch (e) { }
      }
    };
  }

  launchPipeline();

  // Log FPS every 5 seconds
  const statsInterval = setInterval(() => {
    if (!running) { clearInterval(statsInterval); return; }
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > 0) {
      const fps = Math.round(totalFrames / elapsed);
      console.log(`[STATS] ${fps} FPS avg (${totalFrames} frames / ${elapsed.toFixed(0)}s)`);
    }
  }, 5000);
}

// ─── Main ────────────────────────────────────────────────────────
function startCapture() {
  console.log('[CAPTURE] Starting...');
  getDeviceSize();
  startScreenRecordPipeline();
}

function stopCapture() {
  if (captureProcess) {
    console.log('[CAPTURE] Stopping...');
    captureProcess.kill();
    captureProcess = null;
    currentMethod = 'none';
  }
}

// ─── Start ───────────────────────────────────────────────────────
getDeviceSize();
server.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────────┐
│       AppStream Server v3.0 (30+ FPS)       │
├─────────────────────────────────────────────┤
│  HTTP:    http://localhost:${PORT}              │
│  Video:   ws://localhost:${PORT}/video          │
│  Input:   ws://localhost:${PORT}/input          │
├─────────────────────────────────────────────┤
│  Device:  ${deviceWidth}x${deviceHeight}                      │
│  Engine:  screenrecord → FFmpeg → MJPEG     │
│  Scale:   ${CAPTURE_SCALE}p @ ${TARGET_FPS} FPS target          │
│  Waiting for clients...                     │
└─────────────────────────────────────────────┘
  `);
});

process.on('SIGINT', () => {
  console.log('\n[SERVER] Shutting down...');
  stopCapture();
  process.exit(0);
});
