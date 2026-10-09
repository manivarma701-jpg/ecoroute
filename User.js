const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long']
    },
    greenPoints: {
      type: Number,
      default: 0,
      min: [0, 'Green points cannot be negative']
    },
    totalCo2SavedKg: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDistanceKm: {
      type: Number,
      default: 0,
      min: 0
    },
    tripsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    streakDays: {
      type: Number,
      default: 1,
      min: 0
    },
    badgeTier: {
      type: String,
      default: 'Sprout Explorer',
      enum: ['Sprout Explorer', 'Forest Guardian', 'Earth Guardian', 'Planet Savior']
    },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    }
  },
  {
    timestamps: true
  }
);

// Method to update user's badge tier dynamically based on green points
userSchema.methods.updateTier = function () {
  if (this.greenPoints >= 1000) {
    this.badgeTier = 'Planet Savior';
  } else if (this.greenPoints >= 600) {
    this.badgeTier = 'Earth Guardian';
  } else if (this.greenPoints >= 300) {
    this.badgeTier = 'Forest Guardian';
  } else {
    this.badgeTier = 'Sprout Explorer';
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
