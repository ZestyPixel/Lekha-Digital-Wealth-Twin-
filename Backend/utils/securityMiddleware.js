const User = require('./models/user.js');
const mongoose = require('mongoose'); 

async function securityMiddleware(req, res, next) {
    try {
        let device = 'exampleDevice';
        let amount = 9999;
        const id = req.userId;
        let riskScore = 0;

        const user = await User.findById( id );

        const loginGap = Date.now() - user.behaviouralBaseline.lastLoginTime;

        if (loginGap/1000 < 10) {
            riskScore += 30;
        }
        if(user.behaviouralBaseline.trustedDevices.includes(device)){
            riskScore += 20;
        }
        if( amount > (2 * user.behaviouralBaseline.averageTransactionAmount) ){
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