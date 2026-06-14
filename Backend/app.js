const express = require('express');
const mongoose = require('mongoose'); 
const cors = require('cors');
require('dotenv').config();
const { verify } = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const{ createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken } = require('./utils/tokens.js');
const User = require('./models/user.js');
const Asset = require('./models/assets.js');
const Debt = require('./models/debt.js');
const Transaction = require('./models/transactions.js');
const Goal = require('./models/goals.js');
const Profile = require('./models/profile.js');
const Log = require('./models/logs.js');
const Finances = require('./models/consolidatedFinances.js');

const { GoogleGenAI } = require("@google/genai"); //To use gemini flash.
const ai = new GoogleGenAI({});

const { isAuth } = require('./utils/isAuth.js');
const bcrypt = require('bcrypt');
const authMiddleware = require('./middlewares/authMiddleware.js')
const securityMiddleware = require('./middlewares/securityMiddleware.js');

const { cleanAsset, cleanGoals, cleanDebts, cleanFinances, cleanProfile } = require('./utils/dataCleaning.js');

app.use(cors({
    origin: ['http://localhost:5173', 'https://lekha-digital-wealth-twin.vercel.app'],
    credentials: true
})); 
app.use(express.json());
app.use(cookieParser()); 
app.use(express.urlencoded({ extended: true }));

function cacheFix (req, res, next){
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};

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
            behavioralBaseline:{averageTransactionAmount: 100},
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
        user.behavioralBaseline.lastLoginTime = new Date();
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
        const debt = await Debt.find({userId: userId});
        const finances = await Finances.find({userId: userId});

        const { password, ...data } = userData.toObject(); //This removes the password field from the user data before sending it to the frontend.

        res.json({
            data, 
            transaction, 
            asset, 
            goal, 
            profile, 
            debt,
            finances,
        });
        
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

app.get('/advice', authMiddleware, cacheFix, async (req, res) => {
    const data = await Finances.findOne({ userId: req.userId });
    const assets = await Asset.find({
        userId: req.userId,
        type: { $ne: 'Bank Account' }, // Excluded since bank account data is already in Finances
    });
    const goals = await Goal.find({ userId: req.userId });
    const debt = await Debt.find({ userId: req.userId });
    const profile = await Profile.findOne({ userId: req.userId });

    const cleanedFinances = cleanFinances(data);
    const cleanedAssets = assets.map(cleanAsset);
    const cleanedGoals = goals.map(cleanGoals);
    const cleanedDebts = debt.map(cleanDebts);
    const cleanedProfile = cleanProfile(profile);

    const content = `
        You are a personal finance advisor.

        Analyze the user's financial data below.

        Rules:
        - Identify the biggest weakness.
        - Explain why it is a problem.
        - Give one specific action to improve it.
        - Maximum 25 words.
        - Return only the advice.
        - Do not invent financial information.

        Nation: India

        Finances:
        ${JSON.stringify(cleanedFinances, null, 2)}

        Assets:
        ${JSON.stringify(cleanedAssets, null, 2)}

        Goals:
        ${JSON.stringify(cleanedGoals, null, 2)}

        Debts:
        ${JSON.stringify(cleanedDebts, null, 2)}

        Monthly Profile:
        ${JSON.stringify(cleanedProfile, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: content,
    });

    const resp = response.text.trim();

    res.json(resp);
});

app.post('/addlumpsum', authMiddleware, securityMiddleware, async(req, res)=>{
    const userId = req.userId;
    const user = await User.findById(userId);
    const {pin} = req.body;
    const compare = await user.comparePassword(pin);
    if (!compare) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { amount, assetType, fundName, purchaseDate } = req.body;

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

    await Asset.findOneAndUpdate(
        { userId, type: "Bank Account" },
        { $inc: {currentValue: -amount}} 
    )

    res.json({
        success: true,
        security: req.security
    });
});

app.post('/addsip', authMiddleware, securityMiddleware, async(req, res)=>{
    const userId = req.userId;
    const { amount, assetType, fundName, sipDate, startDate} = req.body;
    if(assetType === "MutualFund"){
        await Asset.findOneAndUpdate(
            { userId, type: "Mutual Funds" },
            { $inc: {currentValue: amount}}
        )
    }else{
        await Asset.findOneAndUpdate(
            { userId, type: "Gold" },
            { $inc: {currentValue: amount}} 
        )
    }
    res.json({
        success: true,
        security: req.security
    });
});

app.post('/transferwithdraw', authMiddleware, securityMiddleware, async(req, res)=>{
    const userId = req.userId;
    console.log(req.body);
    const { transactionType, amount, sourceType, destinationType, destAccountNumber, destIfsc, destBankName, destFundName, destGoldGrams, destGoldPurity, 
        destStockShares, transactionDate } = req.body;
    
    if(transactionType === "Transfer"){
        await Asset.findOneAndUpdate(
            { userId, type: "Account" },
            { $inc: {currentValue: -amount}}
        );
    }else if(sourceType === "MutualFund"){
        await Asset.findOneAndUpdate(
            { userId, type: "Mutual Funds" },
            { $inc: {currentValue: -amount}}
        );

        await Asset.findOneAndUpdate(
            {userId, type: "Bank Account"},
            { $inc: {currentValue: amount}}
        );

    }else{
        await Asset.findOneAndUpdate(
            { userId, type: "Gold" },
            { $inc: {currentValue: -amount}}
        );

        await Asset.findOneAndUpdate(
            {userId, type: "Bank Account"},
            { $inc: {currentValue: amount}}
        );
    }
    
    res.json({
        success: true,
        security: req.security
    });
});

app.post('/adddebt', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { debtName, totalAmount, remainingBalance, monthlyEMI } = req.body;

    try {
        const newDebt = await Debt.create({
            userId,
            debtName,
            totalAmount,
            remainingBalance,
            monthlyEMI,
        });

        res.json({ success: true, debt: newDebt });
    } catch (error) {
        console.error("Add debt error:", error);
        res.json({ success: false, error: "Failed to add debt" });
    }
});

app.get('/getFinancialScore', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        const profile = await Profile.findOne({ userId });
        const assets  = await Asset.find({ userId });
        const debts   = await Debt.find({ userId });

        const {
            monthlyIncome: salary,
            bills, food, health,
            obligations, lifestyle,
            misc, transport, savings,
        } = profile;

        const bankBalance = assets
            .filter(a => a.type === 'Bank Account')
            .reduce((sum, a) => sum + a.currentValue, 0);

        const investedAssets = assets
            .filter(a => ['Stocks', 'Mutual Funds', 'Gold', 'Real Estate'].includes(a.type))
            .reduce((sum, a) => sum + a.currentValue, 0);

        const totalAssets = assets
            .reduce((sum, a) => sum + a.currentValue, 0);

        const totalMonthlyEMI       = debts.reduce((sum, d) => sum + d.monthlyEMI, 0);
        const totalRemainingBalance = debts.reduce((sum, d) => sum + d.remainingBalance, 0);

        const breakdown = [];
        let score = 0;

        const savingsRate = savings / salary;
        const p1 = Math.min(20, Math.round((savingsRate / 0.20) * 20));
        score += p1;

        if (savingsRate >= 0.20) {
            breakdown.push("+ Excellent savings rate");
        } else if (savingsRate >= 0.10) {
            breakdown.push(`~ Savings rate is decent but below the 20% target`);
        } else {
            breakdown.push("- Savings rate is low; aim to save at least 20% of income");
        }

        const essentialExpenses = bills + food + health + obligations + transport;
        const emergencyMonths   = bankBalance / essentialExpenses;
        const p2 = Math.min(20, Math.round((emergencyMonths / 6) * 20));
        score += p2;

        if (emergencyMonths >= 6) {
            breakdown.push("+ Strong emergency fund covering 6+ months of expenses");
        } else if (emergencyMonths >= 3) {
            breakdown.push("~ Emergency fund covers 3-6 months, keep building");
        } else {
            breakdown.push("- Emergency fund is critically low (under 3 months)");
        }

        const discretionaryRate = (lifestyle + misc) / salary;
        let p3 = 20;
        if (discretionaryRate > 0.30) {
            const overshoot = discretionaryRate - 0.30;
            p3 = Math.max(0, Math.round(20 - (overshoot / 0.30) * 20));
        }
        score += p3;

        if (discretionaryRate <= 0.30) {
            breakdown.push("+ Lifestyle spending is well under control");
        } else if (discretionaryRate <= 0.50) {
            breakdown.push("~ Discretionary spending is above 30%, try to cut back");
        } else {
            breakdown.push("- Lifestyle spending is excessive, review misc and lifestyle costs");
        }

        const investmentRatio = investedAssets / totalAssets;
        const p4 = Math.min(20, Math.round((investmentRatio / 0.50) * 20));
        score += p4;

        if (investmentRatio >= 0.50) {
            breakdown.push("+ Great investment allocation, wealth is actively growing");
        } else if (investmentRatio >= 0.25) {
            breakdown.push("~ Some investments present but below the 50% target");
        } else {
            breakdown.push("- Most wealth is sitting idle, consider investing more");
        }

        const dtiRatio = totalMonthlyEMI / salary;
        const p5 = Math.max(0, Math.round(20 - (dtiRatio / 0.40) * 20));
        score += p5;

        if (dtiRatio === 0) {
            breakdown.push("+ Debt-free, no EMI burden on income");
        } else if (dtiRatio <= 0.20) {
            breakdown.push("~ EMI obligations are manageable");
        } else {
            breakdown.push("- High EMI-to-income ratio, debt is straining your finances.");
        }

        const badDebtKeywords = ['credit card', 'personal loan'];
        const hasBadDebt = debts.some(d =>
            badDebtKeywords.some(keyword => d.debtName.toLowerCase().includes(keyword))
        );
        if (hasBadDebt) {
            score -= 10;
            breakdown.push("- Active high-interest consumer debt");
        }

        const netWorth = totalAssets - totalRemainingBalance;
        if (netWorth < 0) {
            score -= 15;
            breakdown.push("- Negative net worth, liabilities exceed assets");
        }

        score = Math.max(0, Math.min(100, score));

        await Finances.findOneAndUpdate(
            { userId },
            {
                $set: {
                    bankBalance,
                    investedAssets,
                    totalAssets,
                    totalMonthlyEMI,
                    totalRemainingBalance,
                    savingsRate,
                    essentialExpenses,
                    emergencyMonths,
                    discretionaryRate,
                    investmentRatio,
                    dtiRatio,
                    netWorth,
                    hasBadDebt,
                    score,
                    breakdown,
                },
            },
            { upsert: true, new: true } //upsert: true to update if it exists or create if it does not. 
            // Also new: true returns the updated document and not the old document.
        );

        res.json({ score, breakdown });

    } catch (error) {
        console.error('Error in /getFinancialScore:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/chatbot', authMiddleware, async (req, res)=>{
    const { message, history } = req.body;
    const data = await Finances.findOne({ userId: req.userId });
    const assets = await Asset.find({ 
        userId: req.userId,
        type: { $ne: 'Bank Account' }, //To exclude bank account data, which we already fed from the finances collection.
     });
    const goals = await Goal.find({userId: req.userId});
    const debt = await Debt.find({userId: req.userId});
    const profile = await Profile.findOne({ userId: req.userId });

    const cleanedFinances = cleanFinances(data);
    const cleanedAssets = assets.map(cleanAsset);
    const cleanedGoals = goals.map(cleanGoals);
    const cleanedDebts = debt.map(cleanDebts);
    const cleanedProfile = cleanProfile(profile);

    const conversation = history.map(msg => `${msg.role}: ${msg.text}`).join('\n');

    const content = `

        You are a financial advisor chatbot.

        Rules:
        - Answer the user's latest message.
        - Use the financial data provided below.
        - Be concise (under 150 words).
        - Give actionable advice.
        - Do not invent financial information.

        User Message:
        ${message}

        Conversation history:${conversation}

        User's current financial snapshot:

        Finances:
        ${JSON.stringify(cleanedFinances, null, 2)}

        Assets:
        ${JSON.stringify(cleanedAssets, null, 2)}

        Goals:
        ${JSON.stringify(cleanedGoals, null, 2)}

        Debts:
        ${JSON.stringify(cleanedDebts, null, 2)}

        Monthly Profile:
        ${JSON.stringify(cleanedProfile, null, 2)}
    `
     console.log(content);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: content,
    });

    const resp = response.text.trim();

    res.json({
        finalData: resp,
    })
})

app.post('/askHisaab', authMiddleware, async (req, res)=>{

    // await new Promise(()=>{}); to make an indefinite pause

    const { query } = req.body;
    const data = await Finances.findOne({ userId: req.userId });
    const assets = await Asset.find({ 
        userId: req.userId,
        type: { $ne: 'Bank Account' }, //To exclude bank account data, which we already fed from the finances collection.
     });
    const goals = await Goal.find({userId: req.userId});
    const debt = await Debt.find({userId: req.userId});
    const profile = await Profile.findOne({ userId: req.userId });

    const cleanedFinances = cleanFinances(data);
    const cleanedAssets = assets.map(cleanAsset);
    const cleanedGoals = goals.map(cleanGoals);
    const cleanedDebts = debt.map(cleanDebts);
    const cleanedProfile = cleanProfile(profile);

    //What this does is it converts the transaction object to a string. 
    //What the null does is it removes any extra spaces from the stringified object and the 2 adds indentation to make it more readable.
    
    const contents = `

        You are Hisaab, a strict, numbers-first personal finance advisor for a user in India. All monetary values below are in INR.

        Transaction requested:
        ${JSON.stringify(query, null, 2)}

        User's current financial snapshot:

        Finances:
        ${JSON.stringify(cleanedFinances, null, 2)}

        Assets:
        ${JSON.stringify(cleanedAssets, null, 2)}

        Goals:
        ${JSON.stringify(cleanedGoals, null, 2)}

        Debts:
        ${JSON.stringify(cleanedDebts, null, 2)}

        Monthly Profile:
        ${JSON.stringify(cleanedProfile, null, 2)}

        Work through this internally. Do not show these steps in your output.

        Step 1 - Feasibility:
        First check if the transaction is even possible (check value of asset, bank account, etc whichever is relevant)
        In case of mutual funds or gold etf, look up the specific fund itself and consider its performance.

        Step 2 - Impact (only if Step 1 passes):
        Estimate netWorth, investedAssets, bankBalance, and savingsRate after this transaction.
        Weigh the opportunity cost.
        Check the effect on progress toward Goals, especially High priority goals with near deadlines.
        Check Debts and totalMonthlyEMI for any effect on debt servicing or the emergency fund.
        If the transaction's "reason" is discretionary/consumption, prefer wealth creation over consumption unless the amount is small relative to discretionary capacity in Monthly Profile.

        Output rules:
        Return ONLY a valid JSON object. No markdown, no code fences, nothing outside the JSON. Output must start with { and end with }.
        "reason" and "alternative" must each cite at least one specific number or name from the data above (an amount, percentage, asset, or goal). No generic advice.
        Be decisive: choose "YES" or "NO" with no hedging.
        "reason": maximum 25 words.
        "alternative": maximum 20 words.

        {
        "decision": "YES" | "NO",
        "risk": "LOW" | "MEDIUM" | "HIGH",
        "reason": "...",
        "alternative": "..."
        }

        `
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
    });

    const text = response.text; //What .text does is it extracts the text content from the response object returned by the Gemini API. 
    // The response object may contain other metadata, but we are only interested in the generated text, which is accessed using .text.

    let parsed;

    parsed = JSON.parse(text); // What JSON.parse does is it takes the text string returned by the Gemini API and converts it into a JavaScript object 
    // that we can easily work with in our code.

    res.json({
        finalData: parsed,
    })
})

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));