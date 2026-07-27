const bcrypt = require('bcrypt');
const Session = require('../models/session');

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;

function generateSixDigitCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function generateOtpCode() {
    return generateSixDigitCode();
}

async function storeOtp({ userId, plainCode, purpose, pendingAction = null }) {
    const hashedCode = await bcrypt.hash(plainCode, 10);

    await Session.findOneAndUpdate(
        { userId },
        {
            otpCode: hashedCode,
            otpPurpose: purpose,
            otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
            otpVerifyAttempts: 0,
            pendingAction: pendingAction || undefined,
        },
        { upsert: true, new: true }
    );

    return { expiresInSeconds: OTP_TTL_MS / 1000 };
}

async function verifyOtp({ userId, purpose, submittedCode }) {
    const session = await Session.findOne({ userId });

    if (!session || !session.otpCode || session.otpPurpose !== purpose) {
        return { valid: false, reason: 'No active OTP for this action. Request a new one.' };
    }

    if (session.otpExpiresAt < new Date()) {
        await clearOtp(userId);
        return { valid: false, reason: 'Code expired. Request a new one.' };
    }

    if (session.otpVerifyAttempts >= MAX_VERIFY_ATTEMPTS) {
        await clearOtp(userId);
        return { valid: false, reason: 'Too many incorrect attempts. Request a new one.' };
    }

    const match = await bcrypt.compare(submittedCode, session.otpCode);

    if (!match) {
        session.otpVerifyAttempts += 1;
        await session.save();
        return {
            valid: false,
            reason: `Incorrect code. ${MAX_VERIFY_ATTEMPTS - session.otpVerifyAttempts} attempt(s) left.`,
        };
    }

    const pendingAction = session.pendingAction;
    await clearOtp(userId);
    return { valid: true, pendingAction };
}

async function clearOtp(userId) {
    await Session.findOneAndUpdate(
        { userId },
        {
            $unset: { otpCode: 1, otpPurpose: 1, otpExpiresAt: 1, pendingAction: 1 },
            otpVerifyAttempts: 0,
        }
    );
}

module.exports = { generateOtpCode, storeOtp, verifyOtp, clearOtp };