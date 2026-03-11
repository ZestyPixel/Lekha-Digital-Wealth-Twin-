const User = require('../models/user');
const mongoose = require('mongoose'); 

async function securityMiddleware(req, res, next) {
    try {
        const id = req.userId;
        let { amount } = req.body;
        let device = false;
        let riskScore = 0;

        const user = await User.findById( id );

        const loginGap = Date.now() - user.behavioralBaseline.lastLoginTime;
        console.log(loginGap);
        if (loginGap/1000 < 20) {
            riskScore += 30;
        }
        if(!device){ //user.behaviouralBaseline.trustedDevices.includes(device)
            riskScore += 20;
        }
        if( amount > (2 * user.behavioralBaseline.averageTransactionAmount) ){
            riskScore +=20;
        }
        req.riskScore = riskScore;

        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Security middleware failed" });
    }
}

module.exports = securityMiddleware;