const express = require('express');
const mongoose = require('mongoose'); 
const cors = require('cors'); //cors is needed to allow requests from the frontend which will be running on a different port.
require('dotenv').config(); //This is to load environment variables from a .env file.
const {verify} = require('jsonwebtoken'); //This is to verify the JWT token sent by the client in the Authorization header.
const cookieParser = require('cookie-parser'); //This is to parse the cookies sent by the client. 
const app = express();
const{createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken,} = require('./utils/tokens.js');
const User = require('./models/user.js');
const {isAuth} = require('./utils/isAuth.js');
const bcrypt = require('bcrypt'); //bcrypt is used to hash stuff like passwords and refresh tokens before saving them to the database for security reasons.
const authMiddleware = require('./middlewares/authMiddleware.js');

app.use(cors({
    origin: 'https://lekha-digital-wealth-twin.vercel.app/', // Replace with your actual Frontend URL/Port
    credentials: true
})); 
app.use(express.json()); //This is to parse the JSON body sent by the client. Otherwise, req.body will be undefined.
app.use(cookieParser()); 
app.use(express.urlencoded({extended: true})); //This is to parse URL-encoded data sent by the client. extended: true allows for rich objects and arrays to be encoded into the URL-encoded format. 
// If extended were false, you would only be able to parse simple key-value pairs in the URL-encoded data.

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.post('/register', async (req, res)=>{
    const {name, email, password} = req.body;
    try{
        const checkIfExists = await User.findOne({email});
        if(checkIfExists) throw new Error("User Already Exists, Pleae Log In.");

        const newUser = new User({
            name: name,
            email: email,
            password: password, //Hashing will be done by schema middleware.
        });
        const data = await newUser.save();
    }catch(err){
        return res.status(400).json({ error: err.message });
    }
    return res.status(201).json({ message: "User created successfully" });
});

app.post('/login', async (req, res)=>{
    const {email, password} = req.body;
    console.log(email, password);
    try{
        const user = await User.findOne({email});
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const compare = await user.comparePassword(password);
        if (!compare) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const refreshToken = createRefreshToken(user.id);
        const accessToken = createAccessToken(user.id);
        const hashedToken = await bcrypt.hash(refreshToken, 10);
        user.refreshToken = hashedToken;
        await user.save();
        sendRefreshToken(res, refreshToken);
        res.send({
            accessToken,
            email: user.email,
            name: user.name,
            userId: user._id
        });
    }catch(err){
        res.send(err);
    }
});

app.post('/logout', (req, res)=>{
    res.clearCookie('refreshToken', { path: '/refresh_token'}); //path helps the browser to know which cookie to clear. 
    // Since we set the refresh token cookie with the path '/refresh_token', we need to specify the same path here to clear it.
    return res.send({
        message: "Logged Out",
    })
});

app.post('/refresh_token', async (req, res)=>{
    const token = req.cookies.refreshToken;

    if(!token) return res.send({accessToken: ''});

    let payload = null;
    try{
        payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
    }catch(err){
        res.clearCookie('refreshToken', { path: '/refresh_token'});
        return res.send({accessToken: ''});
    }

    const user = await User.findById(payload.userId);
    if(!user) {
        res.clearCookie('refreshToken', { path: '/refresh_token'});
        return res.send({accessToken: ''});
    }

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if(!isValid){
        user.refreshToken = null;
        await user.save();
        res.clearCookie('refreshToken', { path: '/refresh_token'});
        return res.send({ accessToken: ''});
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    req.body = { email: user.email };
    sendRefreshToken(res, refreshToken);
    sendAccessToken(req, res, accessToken);
    
});

app.get('/getUserData', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        console.log('Fetching user data for userId:', userId);

        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...safeUserData } = userData.toObject();

        res.json(safeUserData);
    } catch (error) {
        console.error('Error in /getUserData:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));