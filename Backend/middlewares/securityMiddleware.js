const User = require('../models/user');
const mongoose = require('mongoose'); 
// Add location check, transaction frequency, device fingerprint, failed login attempts
async function securityMiddleware(req, res, next) {
    try {
        const id = req.userId;
        let { amount } = req.body;
        let device = false;
        let riskScore = 0;
        let reasons = [];

        const user = await User.findById( id );

        const loginGap = Date.now() - user.behavioralBaseline.lastLoginTime;
        if (loginGap/1000 < 20) {
            riskScore += 25;
            reasons.push("Action too fast after login");
        }

        if(!device){ //user.behaviouralBaseline.trustedDevices.includes(device)
            riskScore += 20;
            reasons.push("New device detected");
        }

        const hour = new Date().getHours();
        if (hour >= 0 && hour <= 6) {
            riskScore += 20;
            reasons.push("Unusual late-night transaction");
        }
        
        if( amount > (2 * user.behavioralBaseline.averageTransactionAmount) ){
            riskScore += 25;
            reasons.push("Unusual transaction amount");
        }

        // if (user.otpAttempts > 2) {
        //     riskScore += 20;
        //     reasons.push("Multiple OTP attempts");
        // }
        
        if (amount % 10000 === 0) {
            riskScore += 10;
            reasons.push("Round number transaction pattern");
        }

        let decision = "ALLOW";
        if (riskScore >= 70){
            decision = "BLOCK";
        }else if (riskScore >= 40){
            decision = "WARN";
        }
        req.security = {
            riskScore,
            decision,
            reasons,
        };
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Security middleware failed" });
    }
}

module.exports = securityMiddleware;