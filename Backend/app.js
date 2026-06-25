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

const { cleanAsset, cleanGoals, cleanDebts, cleanFinances, cleanProfile, extractStockContext } = require('./utils/dataCleaning.js');

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

app.post('/addasset', authMiddleware, async (req, res) => {
  const { type, currentValue, institution } = req.body;
  const userId = req.userId;

  try {
    const asset = await Asset.findOneAndUpdate(
      { userId, type },
      { $inc: { currentValue: currentValue } },
      { new: true, upsert: true, setDefaultsOnInsert: true } //What new: true does is it returns the updated document after the update operation. 
      // If you don't set this option, it will return the document as it was before the update.
      // upsert: true means that if a document matching the query doesn't exist, it will create a new one with the specified update.
      // setDefaultsOnInsert: true means that if a new document is created due to the upsert, 
      // it will apply the default values defined in the schema for any fields that are not specified in the update.
    );

    console.log(asset);
    setTimeout(() => {
      res.json({ success: true, asset });
    }, 1000);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
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
    const { age, riskProfile, monthlyIncome, bills, food, health, lifestyle, misc, obligations, savings, transport } = req.body;

    await Profile.findOneAndUpdate(
        { userId },
        { age, riskProfile, monthlyIncome, bills, food, health, lifestyle, misc, obligations, savings, transport },
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
        model: "gemini-3.1-pro-preview",
        contents: content,
        thinkingConfig: {
            thinkingLevel: "low"
        }
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
            // If the price field doesn't exist, it will create it and set it to the value of amount.F
        )
    } else if(assetType === "Stocks"){
        await Asset.findOneAndUpdate(
            { userId, type: "Stocks" },
            { $inc: {currentValue: amount}} 
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
    } else if(assetType === "Stocks"){
        await Asset.findOneAndUpdate(
            { userId, type: "Stocks" },
            { $inc: {currentValue: amount}} 
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

    } else if(sourceType === "Stocks"){
        await Asset.findOneAndUpdate(
            { userId, type: "Stocks" },
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
            monthlyIncome: salary, age, riskProfile, 
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
        config: {
            tools: [{ googleSearch: {} }] 
        }
    });

    const resp = response.text.trim();

    res.json({
        finalData: resp,
    })
})

app.post('/askHisaab', authMiddleware, async (req, res)=>{

    // await new Promise(()=>{}); to make an indefinite pause

    const { query } = req.body;
    console.log(query);
    const { assetType, fundName } = query;

    const question = `What is the ISIN number of ${JSON.stringify(fundName, null, 2)} ?`;
    console.log(question);

    const mf = false;
    let reply;
    if(assetType == "MutualFund"){
        const mf = true;
        reply = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: question,
            config: {
                tools: [{ googleSearch: {} }], 
            },
            
        });
    }

    let detes;

    if(mf){
        const ans = reply.text;

        const regex = /\b[A-Z0-9]{12}\b/;
        const match = ans.match(regex);
        console.log(match[0]);

        let mfdata;

        if (match) {
            const isin = match[0];
            const url = `https://mf.captnemo.in/kuvera/${isin}`;
            
            try {
                const response = await fetch(url);
            
                mfdata = await response.json(); 
            
                console.log(mfdata);
            
            } catch (error) {
                console.error("Failed to fetch mutual fund data:", error);
            }
        } else {
            console.log("No ISIN was found in the text.");
        }
        
        const fund = mfdata[0];

        // Returns
        const {
            returns: {
                year_1: return1Y,
                year_3: return3Y,
                year_5: return5Y,
                inception: returnInception,
                date: returnsDate,
            } = {},
            volatility,
            fund_rating: fundRating,
            fund_rating_date: fundRatingDate,
        } = fund;

        // Fund Details
        const {
            crisil_rating: crisilRating,
            investment_objective: investmentObjective,
            portfolio_turnover: portfolioTurnover,
            aum,
        } = fund;

        const comparison = fund.comparison ?? [];

        const categoryAvg = (key) => {
            const valid = comparison.filter((fund) => {
                return fund[key];
            });

            const total = valid.reduce((sum, fund) => {
                return sum + fund[key];
            }, 0);

            const average = total / valid.length;

            return average.toFixed(2);
        };

        const categoryAvg1Y            = categoryAvg("1y");
        const categoryAvg3Y            = categoryAvg("3y");
        const categoryAvg5Y            = categoryAvg("5y");
        const categoryAvgVolatility    = categoryAvg("volatility");
        const categoryAvgExpenseRatio  = categoryAvg("expense_ratio");

        const bestPeer1Y           = [...comparison].sort((a, b) => b["1y"] - a["1y"])[0];
        const bestPeer3Y           = [...comparison].sort((a, b) => b["3y"] - a["3y"])[0];
        const bestPeer5Y           = [...comparison].sort((a, b) => b["5y"] - a["5y"])[0];
        const lowestVolatilityPeer = [...comparison].sort((a, b) => a["volatility"] - b["volatility"])[0];

    } else if ( assetType == "Stocks"){
        console.log("hello");
        const stock = await fetch(`https://stock.indianapi.in/stock?name=${encodeURIComponent(fundName)}`, {
            headers: {
                'x-api-key': process.env.STOCK_API_KEY,
            }
        });
        const jsonStock = await stock.json();
        detes = extractStockContext(jsonStock);
    }    
              
    const data = await Finances.findOne({ userId: req.userId });
    const assets = await Asset.find({ 
        userId: req.userId,
        type: { $ne: 'Bank Account' }, //To exclude bank account data, which we already fed from the finances collection.
     });
    const goals = await Goal.find({userId: req.userId});
    const debt = await Debt.find({userId: req.userId});
    const profile = await Profile.findOne({ userId: req.userId });

    const cleanedFinances = cleanFinances(data);
    const cleanedAssets   = assets.map(cleanAsset);
    const cleanedGoals    = goals.map(cleanGoals);
    const cleanedDebts    = debt.map(cleanDebts);
    const cleanedProfile  = cleanProfile(profile);

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

    ${mf ? `
    Mutual Fund Details (use this for the fund involved in the transaction):
    Name:               ${fund.name}
    Category:           ${fund.fund_category} (${fund.fund_type})
    AUM:                ₹${aum} Lakhs
    Expense Ratio:      ${fund.expense_ratio}%
    Portfolio Turnover: ${portfolioTurnover}
    Investment Objective: ${investmentObjective}

    Performance (as of ${returnsDate}):
        1-Year Return:   ${return1Y}%
        3-Year Return:   ${return3Y}%
        5-Year Return:   ${return5Y}%
        Since Inception: ${returnInception}%

    Risk & Rating:
        Volatility:    ${volatility}%
        CRISIL Rating: ${crisilRating}
        Fund Rating:   ${fundRating}/5 (as of ${fundRatingDate})

    Category Comparison (${fund.fund_category} peers):
        Metric            This Fund     Category Avg  
        1Y Return         ${return1Y}%       ${categoryAvg1Y}%
        3Y Return         ${return3Y}%      ${categoryAvg3Y}%
        5Y Return         ${return5Y}%      ${categoryAvg5Y}%
        Volatility        ${volatility}%    ${categoryAvgVolatility}%
        Expense Ratio     ${fund.expense_ratio}%      ${categoryAvgExpenseRatio}%

    Standout peers:
        Best 1Y return:       ${bestPeer1Y?.short_name} at ${bestPeer1Y?.["1y"]}%
        Best 3Y return:       ${bestPeer3Y?.short_name} at ${bestPeer3Y?.["3y"]}%
        Best 5Y return:       ${bestPeer5Y?.short_name} at ${bestPeer5Y?.["5y"]}%
        Lowest volatility:    ${lowestVolatilityPeer?.short_name} at ${lowestVolatilityPeer?.volatility}%
    ` : ''}

    ${detes ? `
    Stock Details (use this for the stock involved in the transaction):
    Company:         ${detes.companyName} (${detes.industry})
    Current Price:   ₹${detes.currentPrice.NSE} (NSE) / ₹${detes.currentPrice.BSE} (BSE)
    Day Change:      ${detes.percentChange}%
    52-Week Range:   ₹${detes.yearLow} – ₹${detes.yearHigh}
    YTD Change:      ${detes.ytdChange}%
    Market Cap:      ₹${detes.marketCap} Cr
    Risk Profile:    ${detes.risk}

    Analyst Consensus (${detes.analystConsensus.noOfRecommendations} analysts):
        Rating:      ${detes.analystConsensus.averageRating}
        Mean Score:  ${detes.analystConsensus.meanValue.toFixed(2)} / 5 (1 = Strong Buy, 5 = Strong Sell)

    Recent News:
    ${detes.recentNews.map((n, i) => `
        ${i + 1}. ${n.headline} (${new Date(n.date).toDateString()})`).join('\n')}
    ` : ''}

    Work through this internally. Do not show these steps in your output.

    Step 1 - Feasibility:
    Check if the transaction is possible (bank balance, existing holdings, lock-in periods, etc.).
    ${mf ? `For this mutual fund: 1Y return is ${return1Y}% vs category avg of ${categoryAvg1Y}%, volatility is ${volatility}% vs category avg of ${categoryAvgVolatility}%.` : 'For mutual funds or gold ETFs, consider the funds specific performance and risk profile.'}
    ${detes ? `For this stock: current price is ₹${detes.currentPrice.NSE}, sitting in a 52-week range of ₹${detes.yearLow}–₹${detes.yearHigh}. Risk profile is ${detes.risk}. Check if the user has sufficient bank balance for this purchase.` : ''}

    Step 2 - Impact (only if Step 1 passes):
    Estimate netWorth, investedAssets, bankBalance, and savingsRate after this transaction.
    Weigh the opportunity cost.
    Check the effect on progress toward Goals, especially high-priority goals with near deadlines.
    Check Debts and totalMonthlyEMI for any effect on debt servicing or the emergency fund.
    If the transaction's "reason" is discretionary/consumption, prefer wealth creation over consumption unless the amount is small relative to discretionary capacity in Monthly Profile.
    ${mf ? `For this fund: its 3Y return of ${return3Y}% is ${(return3Y - categoryAvg3Y).toFixed(2)}% ${return3Y >= categoryAvg3Y ? "above" : "below"} the category avg (${categoryAvg3Y}%). Its volatility of ${volatility}% is ${(volatility - categoryAvgVolatility).toFixed(2)}% ${volatility <= categoryAvgVolatility ? "below" : "above"} category avg (${categoryAvgVolatility}%). 
    Factor this into your risk and return assessment. Give more priority to 5 year returns` : ''}
    ${detes ? `For this stock: analyst consensus is "${detes.analystConsensus.averageRating}" with a mean score of ${detes.analystConsensus.meanValue.toFixed(2)}/5 across ${detes.analystConsensus.noOfRecommendations} analysts. The stock is ${detes.percentChange}% today and ${detes.ytdChange}% YTD. Factor recent news sentiment and the ${detes.risk} risk profile into your opportunity cost assessment.` : ''}

    Output rules:
    Return ONLY a valid JSON object. No markdown, no code fences, nothing outside the JSON. Output must start with { and end with }.
    "reason" and "alternative" must each cite at least one specific number or name from the data above (an amount, percentage, asset, goal, or fund metric). No generic advice.
    Be decisive: choose "YES" or "NO" with no hedging.
    "reason": maximum 25 words. Make sure to mention one statistic or news (especially in case of stocks) to support your reasoning.
    "alternative": maximum 20 words.

    {
    "decision": "YES" | "NO",
    "risk": "LOW" | "MEDIUM" | "HIGH",
    "reason": "...",
    "alternative": "..."
    }

    `
    const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: contents,
        config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: {
                thinkingLevel: "medium",
            } 
        },
    });

    const text = response.text; //What .text does is it extracts the text content from the response object returned by the Gemini API. 
    // The response object may contain other metadata, but we are only interested in the generated text, which is accessed using .text.
    console.log(text);
    let parsed;

    parsed = JSON.parse(text); // What JSON.parse does is it takes the text string returned by the Gemini API and converts it into a JavaScript object 
    // that we can easily work with in our code.

    res.json({
        finalData: parsed,
    })
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));