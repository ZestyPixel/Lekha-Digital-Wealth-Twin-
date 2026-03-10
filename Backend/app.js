const express = require('express');
const mongoose = require('mongoose'); 
const cors = require('cors');
require('dotenv').config();
const {verify} = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const{createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken,} = require('./utils/tokens.js');
const User = require('./models/user.js');
const Asset = require('./models/assets.js');
const Transaction = require('./models/transactions.js');
const Goal = require('./models/goals.js');
const Profile = require('./models/profile.js');
const Log = require('./models/logs.js');

const { GoogleGenAI } = require("@google/genai"); //To use gemini flash.
const ai = new GoogleGenAI({});

const {isAuth} = require('./utils/isAuth.js');
const bcrypt = require('bcrypt');
const authMiddleware = require('./middlewares/authMiddleware.js');

app.use(cors({
    origin: ['http://localhost:5173', 'https://lekha-digital-wealth-twin.vercel.app'],
    credentials: true
})); 
app.use(express.json());
app.use(cookieParser()); 
app.use(express.urlencoded({extended: true}));

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
            password: password,
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
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.clearCookie('refreshToken', { 
        path: '/refresh_token',
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    }); 
    
    return res.send({
        message: "Logged Out",
    })
});

app.post('/refresh_token', async (req, res)=>{
    const token = req.cookies.refreshToken;
    const isProduction = process.env.NODE_ENV === 'production';

    if(!token) return res.send({accessToken: ''});

    let payload = null;
    try{
        payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
    }catch(err){
        res.clearCookie('refreshToken', { 
            path: '/refresh_token',
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        return res.send({accessToken: ''});
    }

    const user = await User.findById(payload.userId);
    if(!user) {
        res.clearCookie('refreshToken', { 
            path: '/refresh_token',
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        return res.send({accessToken: ''});
    }

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if(!isValid){
        user.refreshToken = null;
        await user.save();
        res.clearCookie('refreshToken', { 
            path: '/refresh_token',
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        return res.send({ accessToken: ''});
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    req.body = { 
        email: user.email,
        name: user.name,
        userId: user._id
    };
    sendRefreshToken(res, refreshToken);
    sendAccessToken(req, res, accessToken);
    
});

app.get('/getUserData', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        const userData = await User.findById(userId);
        const transaction = await Transaction.find({ userId: userId });
        const asset = await Asset.find({ userId: userId });
        const goal = await Goal.find({userId: userId});
        const profile = await Profile.findOne({userId: userId});
        if (!userData || !transaction || !asset) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...data } = userData.toObject(); //This removes the password field from the user data before sending it to the frontend.

        res.json({data, transaction, asset, goal, profile});
    } catch (error) {
        console.error('Error in /getUserData:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/addasset', authMiddleware, async(req, res)=>{
  const { type, currentValue, institution } = req.body;
  const userId = req.userId;
  const newAsset = await new Asset({
    userId,
    type,
    currentValue,
    institution,
  });
  await newAsset.save();
  console.log(newAsset);
  setTimeout(()=>{
    res.json({success: true});
  }, 1000);
});

app.post('/addtransaction', authMiddleware, async(req, res)=>{
    const { type, amount, category, description} = req.body;
    const userId = req.userId;
    const newTransaction = await new Transaction({
        userId,
        amount,
        category,
        status: "Completed",
    });
    await newTransaction.save();
    res.json({success: true});
});

app.post('/addgoal', authMiddleware, async(req, res)=>{
    console.log(req.body);
    const userId = req.userId;
    const {goalName, targetAmount, currentProgress, targetDate, priority} = req.body;
    const newGoal = await new Goal ({
        userId,
        goalName,
        targetAmount,
        currentProgress,
        targetDate,
        priority,
    });
    await newGoal.save();
    res.json({success: true});
})

app.post('/setprofile', authMiddleware, async(req, res)=>{
    const userId = req.userId;
    const {monthlyIncome, bills, food, health, lifestyle, misc, obligations, savings, transport} = req.body;

    await Profile.findOneAndUpdate(
        { userId },
        { monthlyIncome, bills, food, health, lifestyle, misc, obligations, savings, transport },
        { upsert: true, new: true } //If a profile doesn't exist for the user, it will create a new one. 
        // If it does exist, it will update the existing profile with the new data.
    );
    res.json({success: true});
});

app.get('/advice', authMiddleware, async(req, res)=>{
    const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "give one line of financial advice based on latest conditions of the world and india"
    });
    const resp = response.text.trim();
    console.log(resp);
    res.json(resp);
});

app.post('/addlumpsum', authMiddleware, async(req, res)=>{
    const userId = req.userId;
    const { amount, assetType, fundName, purchaseDate } = req.body;
    console.log(req.body);
    if(assetType === "MutualFund"){
        
        await Asset.findOneAndUpdate(
            { userId, type: "Mutual Funds" },
            { $inc: {currentValue: amount}} //$inc does an increment operation, it will add the amount to the existing price field of the asset document. 
            // If the price field doesn't exist, it will create it and set it to the value of amount.
        )
    }else{
        await Asset.findOneAndUpdate(
            { userId, type: "Gold" },
            { $inc: {currentValue: amount}} 
        )
    }
    res.json({success: true});
});

app.post('/addsip', authMiddleware, async(req, res)=>{
    const userId = req.userId;
    const { monthlyAmount, assetType, fundName, sipDate, startDate} = req.body;
    if(assetType === "MutualFund"){
        await Asset.findOneAndUpdate(
            { userId, type: "Mutual Funds" },
            { $inc: {currentValue: monthlyAmount}}
        )
    }else{
        await Asset.findOneAndUpdate(
            { userId, type: "Gold" },
            { $inc: {currentValue: monthlyAmount}} 
        )
    }
    res.json({success: true});
});

app.post('/transferwithdraw', authMiddleware, async(req, res)=>{
    const userId = req.userId;
    console.log(req.body);
    const { transactionType, amount, sourceType, destinationType, destAccountNumber, destIfsc, destBankName, destFundName, destGoldGrams, destGoldPurity, 
        destStockShares, transactionDate } = req.body;
    
    if(transactionType === "Transfer"){
        await Asset.findOneAndUpdate(
            { userId, type: "Account" },
            { $inc: {currentValue: -amount}}
        )
    }else if(sourceType === "MutualFund"){
        await Asset.findOneAndUpdate(
            { userId, type: "Mutual Funds" },
            { $inc: {currentValue: -amount}}
        )
    }else{
        await Asset.findOneAndUpdate(
            { userId, type: "Gold" },
            { $inc: {currentValue: -amount}}
        )
    }
    
    res.json({success: true});
});

app.get('/score', authMiddleware, async(req, res)=>{

});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));