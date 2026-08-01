const webpush = require('web-push');
const Subscription = require('./models/Subscription');
const AppState = require('./models/AppState');

let publicKey = process.env.VAPID_PUBLIC_KEY || null;
let privateKey = process.env.VAPID_PRIVATE_KEY || null;
const mailto = process.env.VAPID_MAILTO || 'mailto:admin@cse5rrt.local';

async function initVapidKeys() {
  try {
    const state = await AppState.getState();
    
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      publicKey = process.env.VAPID_PUBLIC_KEY;
      privateKey = process.env.VAPID_PRIVATE_KEY;
    } else if (state.vapidPublicKey && state.vapidPrivateKey) {
      publicKey = state.vapidPublicKey;
      privateKey = state.vapidPrivateKey;
    } else {
      // Generate new persistent keys once and save to MongoDB
      const newKeys = webpush.generateVAPIDKeys();
      state.vapidPublicKey = newKeys.publicKey;
      state.vapidPrivateKey = newKeys.privateKey;
      await state.save();

      publicKey = newKeys.publicKey;
      privateKey = newKeys.privateKey;
      console.log('🔑 Generated & persisted new VAPID keys to MongoDB');
    }

    webpush.setVapidDetails(mailto, publicKey, privateKey);
    console.log('🔑 Web Push VAPID initialized with key:', publicKey.slice(0, 10) + '...');
  } catch (err) {
    console.error('Failed to initialize VAPID keys:', err);
  }
}

module.exports = {
  initVapidKeys,
  getPublicKey: () => publicKey,

  sendPushToAll: async (payload) => {
    try {
      if (!publicKey || !privateKey) {
        await initVapidKeys();
      }

      const subscriptions = await Subscription.find();
      if (!subscriptions || subscriptions.length === 0) {
        console.log('No subscribers found for Web Push.');
        return;
      }

      const pushPayload = JSON.stringify({
        title: payload.title || 'CSE5 RRT Update ⚡',
        body: payload.body || 'New update published by Admin.',
        url: payload.url || '/',
      });

      console.log(`📡 Sending Web Push to ${subscriptions.length} subscriber(s)...`);

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: sub.keys,
          }, pushPayload);
          console.log('✅ Push sent successfully to subscriber');
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('Removing stale push subscription:', sub.endpoint);
            await Subscription.deleteOne({ _id: sub._id });
          } else {
            console.error('Failed to send push notification:', err.message);
          }
        }
      });

      await Promise.all(sendPromises);
    } catch (err) {
      console.error('Error broadcasting Web Push notifications:', err);
    }
  },
};
