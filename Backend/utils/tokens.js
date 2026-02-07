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

function sendAccessToken(res, req, accessToken){
    res.send({
        accessToken,
        email: req.body.email,
    })
}

function sendAccessToken(res, req, accessToken){
    res.send({
        accessToken,
        email: req.body.email,
    })
}

function sendRefreshToken(res, refreshToken){
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, //To ensure that the cookie is not accessible via JavaScript.
        path: '/refresh_token', //To ensure that the cookie is only sent when the request is made to the /refresh_token endpoint.
    });
}

module.exports = {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
}