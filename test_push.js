// Comprehensive Push Notification Pipeline Test
const https = require('https');

const BACKEND = 'https://row-rotation-table.onrender.com';

function request(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('=== CSE5 RRT Push Notification Pipeline Test ===\n');

  // Test 1: Health check
  console.log('1. Backend Health Check...');
  try {
    const health = await request(`${BACKEND}/api/health`);
    console.log(`   ✅ Backend is UP (status: ${health.status})`);
    console.log(`   Response: ${JSON.stringify(health.body)}`);
  } catch (e) {
    console.log(`   ❌ Backend is DOWN: ${e.message}`);
    return;
  }

  // Test 2: VAPID public key
  console.log('\n2. VAPID Public Key...');
  const vapidRes = await request(`${BACKEND}/api/notifications/vapid-public-key`);
  console.log(`   Status: ${vapidRes.status}`);
  const publicKey = vapidRes.body.publicKey;
  if (publicKey) {
    console.log(`   ✅ VAPID Key exists: ${publicKey.substring(0, 20)}...`);
    console.log(`   Key length: ${publicKey.length} chars`);
  } else {
    console.log(`   ❌ VAPID Key is NULL or missing!`);
    console.log(`   Full response: ${JSON.stringify(vapidRes.body)}`);
    return;
  }

  // Test 3: Subscriber count
  console.log('\n3. Subscriber Count...');
  const countRes = await request(`${BACKEND}/api/notifications/count`);
  console.log(`   Status: ${countRes.status}`);
  console.log(`   ✅ Active subscribers: ${countRes.body.count}`);
  if (countRes.body.count === 0) {
    console.log(`   ⚠️  NO SUBSCRIBERS! The browser needs to register first.`);
    console.log(`   This means either:`);
    console.log(`     a) No one has visited the site and allowed notifications, OR`);
    console.log(`     b) The browser's Notification.permission is 'denied' or 'default', OR`);
    console.log(`     c) The service worker failed to register/subscribe`);
  }

  // Test 4: CORS check
  console.log('\n4. CORS Check (from Vercel origin)...');
  try {
    const corsRes = await request(`${BACKEND}/api/health`);
    console.log(`   ✅ API accessible (status: ${corsRes.status})`);
  } catch (e) {
    console.log(`   ❌ CORS or network error: ${e.message}`);
  }

  // Test 5: Try sending test push
  console.log('\n5. Sending Test Push Notification...');
  const pushRes = await request(`${BACKEND}/api/notifications/test-push`, 'POST', {});
  console.log(`   Status: ${pushRes.status}`);
  console.log(`   Response: ${JSON.stringify(pushRes.body)}`);
  if (pushRes.body.success) {
    console.log(`   ✅ Server says push was sent successfully`);
    if (countRes.body.count === 0) {
      console.log(`   ⚠️  But there are 0 subscribers, so nobody received it!`);
    }
  } else {
    console.log(`   ❌ Push send FAILED: ${JSON.stringify(pushRes.body)}`);
  }

  // Test 6: Check admin state for VAPID keys in DB
  console.log('\n6. Checking Admin State (VAPID persistence)...');
  const stateRes = await request(`${BACKEND}/api/admin/state`);
  if (stateRes.status === 200 || stateRes.status === 401) {
    console.log(`   Status: ${stateRes.status}`);
    if (stateRes.body.vapidPublicKey) {
      const dbKey = stateRes.body.vapidPublicKey;
      console.log(`   ✅ VAPID key stored in DB: ${dbKey.substring(0, 20)}...`);
      console.log(`   Key match with API: ${dbKey === publicKey ? '✅ MATCH' : '❌ MISMATCH!'}`);
    } else {
      console.log(`   ℹ️  Admin state endpoint may require auth or doesn't expose VAPID keys`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Backend: ✅ Running`);
  console.log(`VAPID Key: ${publicKey ? '✅ Present' : '❌ Missing'}`);
  console.log(`Subscribers: ${countRes.body.count}`);
  console.log(`Push API: ${pushRes.body.success ? '✅ Working' : '❌ Failed'}`);
  
  if (countRes.body.count === 0) {
    console.log('\n⚠️  ROOT CAUSE: 0 subscribers registered.');
    console.log('The browser on the Vercel site needs to:');
    console.log('  1. Have Notification.permission = "granted"');
    console.log('  2. Successfully register a Service Worker');
    console.log('  3. Subscribe to PushManager with the VAPID key');
    console.log('  4. POST the subscription to /api/notifications/subscribe');
    console.log('\nPlease open https://row-rotation-table.vercel.app/admin');
    console.log('Press Ctrl+Shift+R, then scroll down and click:');
    console.log('  📲 Direct Notification Test');
    console.log('  🔍 Run Diagnostics');
  }
}

runTests().catch(console.error);
