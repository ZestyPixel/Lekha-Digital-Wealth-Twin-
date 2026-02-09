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
    })
}

function sendRefreshToken(res, refreshToken){
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, //To ensure that the cookie is not accessible via JavaScript.
        path: '/refresh_token', //To ensure that the cookie is only sent to the backend when the user is trying to refresh the access token.
        //This means that while any request can set the refresh token cookie, only requests to the '/refresh_token' 
        // endpoint will include the cookie in the request headers. This adds an extra layer of security by limiting the exposure of the refresh token.
    });
}

module.exports = {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
}