const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: ["Bank Account", "Gold", "Stocks", "Real Estate"],
    },

    currentValue: {
      type: Number,
      min: 0,
    },

    isManualEntry: {
      type: Boolean,
      default: true,
    },

    institution: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);