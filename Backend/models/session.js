const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", //we write this to reference the user model. But since we dont import the user model here,
    // we just write the name of the model as a string. What will happen is that mongoose will look for a model with the name 'User' in the models
    // that have been registered with mongoose.
    // If it finds a model with that name, it will use that model to populate the userId field.
    // If it doesn't find a model with that name, it will throw an error.
  },
  loginAttempts: {
    type: Number,
  },
  transactionAttempts: {
    type: Number,
  },
  loginOtpAttempts: {
    type: Number,
  },
  transactionOtpAttempts: {
    type: Number,
  },
  otpCode: {
    type: String,
  },
  otpPurpose: {
    type: String,
    enum: ["login", "transaction"],
  },
  otpExpiresAt: {
    type: Date,
  },
  otpVerifyAttempts: {
    type: Number,
    default: 0,
  },
  pendingAction: {
    route: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed },
  },
});

module.exports = mongoose.model("Session", sessionSchema);
