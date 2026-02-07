import mongoose from "mongoose";

const logsSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    signalsDetected: {
      type: [String],
      default: [],
    },

    outcome: {
      type: String,
      enum: ["Allowed", "Blocked", "Flagged"],
      required: true,
    },

    userNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SecurityEvent", securityEventSchema);
