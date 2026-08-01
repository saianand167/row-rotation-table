const webpush = require('web-push');
const Subscription = require('./models/Subscription');

// VAPID keys configuration
const vapidKeys = webpush.generateVAPIDKeys();

const publicKey = process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey;
const privateKey = process.env.VAPID_PRIVATE_KEY || vapidKeys.privateKey;
const mailto = process.env.VAPID_MAILTO || 'mailto:admin@cse5rrt.local';

webpush.setVapidDetails(mailto, publicKey, privateKey);

console.log('🔑 Web Push VAPID Public Key initialized');

module.exports = {
  getPublicKey: () => publicKey,

  sendPushToAll: async (payload) => {
    try {
      const subscriptions = await Subscription.find();
      if (!subscriptions || subscriptions.length === 0) return;

      const pushPayload = JSON.stringify({
        title: payload.title || 'CSE5 RRT Update ⚡',
        body: payload.body || 'New update published by Admin.',
        url: payload.url || '/',
      });

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: sub.keys,
          }, pushPayload);
        } catch (err) {
          // If subscription has expired or is invalid (404/410), delete it from DB
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('Removing stale push subscription:', sub.endpoint);
            await Subscription.deleteOne({ _id: sub._id });
          } else {
            console.error('Failed to send push notification to subscriber:', err.message);
          }
        }
      });

      await Promise.all(sendPromises);
    } catch (err) {
      console.error('Error broadcasting Web Push notifications:', err);
    }
  },
};
