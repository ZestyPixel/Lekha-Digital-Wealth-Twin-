const {sign} = require('jsonwebtoken');

function createAccessToken(userId){
    return sign({userId}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m',
    });
}

function createRefreshToken(userId){
    return sign({userId}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d',
    });
}

function sendAccessToken(req, res, accessToken){
    res.send({
        accessToken,
        email: req.body.email,
        name: req.body.name,
        userId: req.body.userId
    })
}

function sendRefreshToken(res, refreshToken){
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction, // true in production (HTTPS), false in localhost
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
        path: '/refresh_token',
        // REMOVED domain option - let the browser use the current domain
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

module.exports = {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
}