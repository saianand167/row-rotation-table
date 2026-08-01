const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const pushNotification = require('../pushNotification');

/**
 * GET /api/notifications/vapid-public-key
 * Returns the VAPID public key needed for PushManager subscription
 */
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: pushNotification.getPublicKey() });
});

/**
 * POST /api/notifications/subscribe
 * Saves or updates a PushSubscription object in MongoDB
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Upsert subscription into MongoDB
    await Subscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'Push subscription saved' });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

/**
 * GET /api/notifications/count
 * Returns total registered push notification subscribers
 */
router.get('/count', async (req, res) => {
  try {
    const count = await Subscription.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count subscriptions' });
  }
});

/**
 * POST /api/notifications/test-push
 * Triggers a test push notification to all subscribed devices
 */
router.post('/test-push', async (req, res) => {
  try {
    await pushNotification.sendPushToAll({
      title: 'CSE5 RRT Test Notification 🔔',
      body: 'Push Notification System is working on your device notification bar!',
    });
    res.json({ success: true, message: 'Test push notification sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send test push' });
  }
});

/**
 * DELETE /api/notifications/clear-subscriptions
 * Wipes all push subscriptions (useful after VAPID key rotation)
 */
router.delete('/clear-subscriptions', async (req, res) => {
  try {
    const result = await Subscription.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear subscriptions' });
  }
});

module.exports = router;
