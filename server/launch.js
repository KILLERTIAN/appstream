#!/usr/bin/env node

const appName = process.argv[2];

if (!appName) {
  console.error('Usage: npm run app <app-name>');
  console.error('Available quick options:');
  console.error('  zomato, swiggy, instagram, chrome, dominos, uno, amazon, chess, roblox');
  console.error('\nExample: npm run app swiggy');
  console.error('Example: npm run app com.example.custom');
  process.exit(1);
}

// See if it looks like a package name or a friendly name
const isPackageMode = appName.includes('.');

const payload = isPackageMode 
  ? { packageName: appName }
  : { appName: appName };

console.log(`Sending launch request for: ${appName}...`);

fetch('http://localhost:8080/launch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      if (data.redirect === 'playstore') {
        console.log(`⚠️ App not installed natively. Redirected device to Play Store: ${data.package}`);
      } else {
        console.log(`✅ Successfully launched ${data.package}`);
      }
    } else {
      console.error(`❌ Failed:`, data.error || data);
    }
  })
  .catch(err => {
    console.error(`❌ Connection error. Is the server running?`, err.message);
  });
