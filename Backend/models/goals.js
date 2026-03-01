const mongoose = require('mongoose');

const goalsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    goalName: {
      type: String,
    },

    targetAmount: {
      type: Number,
    },

    currentProgress: {
      type: Number,
    },

    targetDate: {
      type: Date,
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goals", goalsSchema);