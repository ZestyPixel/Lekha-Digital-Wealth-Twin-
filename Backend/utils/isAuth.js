const {verify} = require('jsonwebtoken');

function isAuth(req){
    const authorization = req.headers['authorization'];
    if(!authorization) throw new Error("You need to login");
    const token = authorization.split(' ')[1]; //Authorization header is in the format "Bearer token" so we split and get the token part.
    const {userId} = verify(token, process.env.ACCESS_TOKEN_SECRET); //This is to verify the token and get the userId from the token. 
    // If the token is invalid or expired, it will throw an error.
    return userId;
}

module.exports = {
    isAuth,
}