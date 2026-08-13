const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const criticalAdminSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'critical_admin',
  },

  passwordHash: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

/**
 * Get or create the singleton critical admin document.
 * On first boot, hashes the CRITICAL_ADMIN_PASSWORD env var.
 */
criticalAdminSchema.statics.getAdmin = async function () {
  let admin = await this.findById('critical_admin');
  if (!admin) {
    const rawPassword = process.env.CRITICAL_ADMIN_PASSWORD || 'critical123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(rawPassword, salt);
    admin = await this.create({
      _id: 'critical_admin',
      passwordHash: hash,
    });
    console.log('🔐 Critical Admin account initialized');
  }
  return admin;
};

/**
 * Compare a candidate password against the stored hash.
 */
criticalAdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Never return passwordHash in any output.
 */
criticalAdminSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

const CriticalAdmin = mongoose.model('CriticalAdmin', criticalAdminSchema);

module.exports = CriticalAdmin;
