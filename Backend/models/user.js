const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  duressPin: {
    type: String,
  },
  emergencyContact: {
    type: String
  },

  behavioralBaseline: {
    trustedDevices: {
      type: [String],
      default: []
    },
    averageTransactionAmount: {
      type: Number,
      default: 0
    },
    usualLoginLocation: {
      type: String
    },
    lastLoginTime: {
      type: Date
    }
  },

  refreshToken: {
    type: String,
    default: "",
  },
  
}, { timestamps: true });


userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.isModified("duressPin")) {
    this.duressPin = await bcrypt.hash(this.duressPin, 10);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.compareDuressPin = async function (candidatePin) {
  return bcrypt.compare(candidatePin, this.duressPin);
};


module.exports = mongoose.model('User', userSchema);