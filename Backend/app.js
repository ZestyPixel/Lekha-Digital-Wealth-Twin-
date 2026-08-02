const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const { verify } = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken,
} = require("./utils/tokens.js");
const User = require("./models/user.js");
const Asset = require("./models/assets.js");
const Debt = require("./models/debt.js");
const Transaction = require("./models/transactions.js");
const Goal = require("./models/goals.js");
const Profile = require("./models/profile.js");
const Log = require("./models/logs.js");
const Finances = require("./models/consolidatedFinances.js");
const Session = require("./models/session.js");
const {
  generateOtpCode,
  storeOtp,
  verifyOtp,
} = require("./utils/otpService.js");

const { google } = require("googleapis");
const MailComposer = require("nodemailer/lib/mail-composer");

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

const { GoogleGenAI } = require("@google/genai"); //To use gemini flash.
const ai = new GoogleGenAI({});

const { isAuth } = require("./utils/isAuth.js");
const bcrypt = require("bcrypt");
const authMiddleware = require("./middlewares/authMiddleware.js");
const securityMiddleware = require("./middlewares/securityMiddleware.js");

const {
  cleanAsset,
  cleanGoals,
  cleanDebts,
  cleanFinances,
  cleanProfile,
  extractStockContext,
} = require("./utils/dataCleaning.js");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://lekha-digital-wealth-twin.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

function cacheFix(req, res, next) {
  //What this does is it sets the Cache-Control header to prevent caching of the response.
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
}

async function executeLumpsum(userId, payload) {
  const { amount, assetType } = payload;
  const typeMap = { MutualFund: "Mutual Funds", Stocks: "Stocks" };
  await Asset.findOneAndUpdate(
    { userId, type: typeMap[assetType] || "Gold" },
    { $inc: { currentValue: amount } },
  );
  await Asset.findOneAndUpdate(
    { userId, type: "Bank Account" },
    { $inc: { currentValue: -amount } },
  );
}

async function executeSip(userId, payload) {
  const { amount, assetType } = payload;
  const typeMap = { MutualFund: "Mutual Funds", Stocks: "Stocks" };
  await Asset.findOneAndUpdate(
    { userId, type: typeMap[assetType] || "Gold" },
    { $inc: { currentValue: amount } },
  );
  await Asset.findOneAndUpdate(
    { userId, type: "Bank Account" },
    { $inc: { currentValue: -amount } },
  );
}

async function executeTransferWithdraw(userId, payload) {
  const { transactionType, amount, sourceType } = payload;
  if (transactionType === "Transfer") {
    await Asset.findOneAndUpdate(
      { userId, type: "Account" },
      { $inc: { currentValue: -amount } },
    );
  } else {
    const typeMap = { MutualFund: "Mutual Funds", Stocks: "Stocks" };
    await Asset.findOneAndUpdate(
      { userId, type: typeMap[sourceType] || "Gold" },
      { $inc: { currentValue: -amount } },
    );
    await Asset.findOneAndUpdate(
      { userId, type: "Bank Account" },
      { $inc: { currentValue: amount } },
    );
  }
}

const TRANSACTION_HANDLERS = {
  "/addlumpsum": executeLumpsum,
  "/addsip": executeSip,
  "/transferwithdraw": executeTransferWithdraw,
};

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const checkIfExists = await User.findOne({ email });
    if (checkIfExists) throw new Error("User Already Exists, Pleae Log In.");

    const newUser = new User({
      name: name,
      email: email,
      password: password,
      behavioralBaseline: { averageTransactionAmount: 100 },
    });
    const data = await newUser.save();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(201).json({ message: "User created successfully" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const compare = await user.comparePassword(password);
    if (!compare) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const otpCode = generateOtpCode();
    try {
      const mail = new MailComposer({
        from: `"Hisaab: Your Finance Assistant" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: "🔐 Your login verification code",
        html: `<p>Your verification code to complete login is:
                <b style="font-size: 18px; letter-spacing: 2px;">${otpCode}</b></p>
                <p>This code expires in 5 minutes. If you did not request this, ignore this email.</p>`,
      });
      const msg = await mail.compile().build();
      const encodedMessage = Buffer.from(msg)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage },
      });
    } catch (error) {
      console.error("Error sending login OTP email", error);
      return res
        .status(500)
        .json({ error: "Could not send verification email" });
    }

    await storeOtp({ userId: user._id, plainCode: otpCode, purpose: "login" });
    return res.json({
      otpRequired: true,
      email: user.email,
      message: "We've emailed a verification code to complete login.",
    });
  } catch (err) {
    res.send(err);
  }
});

app.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("refreshToken", {
    path: "/refresh_token",
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.send({
    message: "Logged Out",
  });
});

app.post("/refresh_token", async (req, res) => {
  const token = req.cookies.refreshToken;
  const isProduction = process.env.NODE_ENV === "production";

  if (!token) return res.send({ accessToken: "" });

  let payload = null;
  try {
    payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    res.clearCookie("refreshToken", {
      path: "/refresh_token",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    return res.send({ accessToken: "" });
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    res.clearCookie("refreshToken", {
      path: "/refresh_token",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    return res.send({ accessToken: "" });
  }

  const isValid = await bcrypt.compare(token, user.refreshToken);
  if (!isValid) {
    user.refreshToken = null;
    await user.save();
    res.clearCookie("refreshToken", {
      path: "/refresh_token",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    return res.send({ accessToken: "" });
  }

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  user.refreshToken = hashedRefreshToken;
  await user.save();

  req.body = {
    email: user.email,
    name: user.name,
    userId: user._id,
  };
  sendRefreshToken(res, refreshToken);
  sendAccessToken(req, res, accessToken);
});

app.get("/getUserData", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const userData = await User.findById(userId);
    const transaction = await Transaction.find({ userId: userId });
    const asset = await Asset.find({ userId: userId });
    const goal = await Goal.find({ userId: userId });
    const profile = await Profile.findOne({ userId: userId });
    const debt = await Debt.find({ userId: userId });
    const finances = await Finances.find({ userId: userId });

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
    console.error("Error in /getUserData:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/addasset", authMiddleware, async (req, res) => {
  const { type, currentValue, institution } = req.body;
  const userId = req.userId;

  try {
    const asset = await Asset.findOneAndUpdate(
      { userId, type },
      { $inc: { currentValue: currentValue } },
      { new: true, upsert: true, setDefaultsOnInsert: true }, //What new: true does is it returns the updated document after the update operation.
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

app.post("/addtransaction", authMiddleware, async (req, res) => {
  const { type, amount, category, description } = req.body;
  const userId = req.userId;
  const newTransaction = await new Transaction({
    userId,
    amount,
    category,
    status: "Completed",
  });
  await newTransaction.save();
  res.json({ success: true });
});

app.post("/addgoal", authMiddleware, async (req, res) => {
  console.log(req.body);
  const userId = req.userId;
  const { goalName, targetAmount, currentProgress, targetDate, priority } =
    req.body;
  const newGoal = await new Goal({
    userId,
    goalName,
    targetAmount,
    currentProgress,
    targetDate,
    priority,
  });
  await newGoal.save();
  res.json({ success: true });
});

app.post("/setprofile", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const {
    age,
    riskProfile,
    monthlyIncome,
    bills,
    food,
    health,
    lifestyle,
    misc,
    obligations,
    savings,
    transport,
    emergencyNumber,
    emergencyEmail,
    number,
  } = req.body;

  await Profile.findOneAndUpdate(
    { userId },
    {
      age,
      riskProfile,
      monthlyIncome,
      bills,
      food,
      health,
      lifestyle,
      misc,
      obligations,
      savings,
      transport,
      emergencyNumber,
      emergencyEmail,
      number,
    },
    { upsert: true, new: true }, //If a profile doesn't exist for the user, it will create a new one.
    // If it does exist, it will update the existing profile with the new data.
  );
  res.json({ success: true });
});

app.get("/advice", authMiddleware, cacheFix, async (req, res) => {
  const data = await Finances.findOne({ userId: req.userId });
  const assets = await Asset.find({
    userId: req.userId,
    type: { $ne: "Bank Account" }, // Excluded since bank account data is already in Finances
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

  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "gemma3:4b",
    prompt: content,
    stream: false,
  });

  const rawText = response.data.response;

  const cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\s*|```/g, "")
    .trim();

  res.json(cleaned);
});

app.post(
  "/addlumpsum",
  authMiddleware,
  securityMiddleware,
  async (req, res) => {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!req.body.otpVerified) {
      const { pin } = req.body;
      const compare = await user.comparePassword(pin);
      if (!compare) {
        console.log(req.security);
        req.security.reasons.push("Wrong Password");
        req.security.decision = "BLOCK";
        return res.json({
          error: "Invalid credentials",
          security: req.security,
        });
      }
    }
    const { amount, assetType, fundName, purchaseDate } = req.body;

    if (
      !req.body.otpVerified &&
      (req.security.decision === "WARN" || req.security.decision === "BLOCK")
    ) {
      return res.json({
        success: false,
        otpRequired: true,
        security: req.security,
        message:
          "We've emailed a verification code to confirm this transaction.",
      });
    }

    if (assetType === "MutualFund") {
      await Asset.findOneAndUpdate(
        { userId, type: "Mutual Funds" },
        { $inc: { currentValue: amount } }, //$inc does an increment operation, it will add the amount to the existing price field of the asset document.
        // If the price field doesn't exist, it will create it and set it to the value of amount.F
      );
    } else if (assetType === "Stocks") {
      await Asset.findOneAndUpdate(
        { userId, type: "Stocks" },
        { $inc: { currentValue: amount } },
      );
    } else {
      await Asset.findOneAndUpdate(
        { userId, type: "Gold" },
        { $inc: { currentValue: amount } },
      );
    }

    await Asset.findOneAndUpdate(
      { userId, type: "Bank Account" },
      { $inc: { currentValue: -amount } },
    );

    res.json({
      success: true,
      security: req.security,
    });
  },
);

app.post("/addsip", authMiddleware, securityMiddleware, async (req, res) => {
  console.log("SIP Request");
  const userId = req.userId;
  const user = await User.findById(userId);
  if (!req.body.otpVerified) {
    const { pin } = req.body;
    const compare = await user.comparePassword(pin);
    if (!compare) {
      console.log(req.security);
      req.security.reasons.push("Wrong Password");
      req.security.decision = "BLOCK";
      return res.json({
        error: "Invalid credentials",
        security: req.security,
      });
    }
  }

  const { amount, assetType, fundName, sipDate, startDate } = req.body;

  if (
    !req.body.otpVerified &&
    (req.security.decision === "WARN" || req.security.decision === "BLOCK")
  ) {
    return res.json({
      success: false,
      otpRequired: true,
      security: req.security,
      message: "We've emailed a verification code to confirm this transaction.",
    });
  }

  if (assetType === "MutualFund") {
    await Asset.findOneAndUpdate(
      { userId, type: "Mutual Funds" },
      { $inc: { currentValue: amount } },
    );
  } else if (assetType === "Stocks") {
    await Asset.findOneAndUpdate(
      { userId, type: "Stocks" },
      { $inc: { currentValue: amount } },
    );
  } else {
    await Asset.findOneAndUpdate(
      { userId, type: "Gold" },
      { $inc: { currentValue: amount } },
    );
  }

  await Asset.findOneAndUpdate(
    { userId, type: "Bank Account" },
    { $inc: { currentValue: -amount } },
  );

  res.json({
    success: true,
    security: req.security,
  });
});

app.post(
  "/transferwithdraw",
  authMiddleware,
  securityMiddleware,
  async (req, res) => {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!req.body.otpVerified) {
      const { pin } = req.body;
      const compare = await user.comparePassword(pin);
      if (!compare) {
        console.log(req.security);
        req.security.reasons.push("Wrong Password");
        req.security.decision = "BLOCK";
        return res.json({
          error: "Invalid credentials",
          security: req.security,
        });
      }
    }

    const {
      transactionType,
      amount,
      sourceType,
      destinationType,
      destAccountNumber,
      destIfsc,
      destBankName,
      destFundName,
      destGoldGrams,
      destGoldPurity,
      destStockShares,
      transactionDate,
    } = req.body;

    if (
      !req.body.otpVerified &&
      (req.security.decision === "WARN" || req.security.decision === "BLOCK")
    ) {
      return res.json({
        success: false,
        otpRequired: true,
        security: req.security,
        message:
          "We've emailed a verification code to confirm this transaction.",
      });
    }

    if (transactionType === "Transfer") {
      await Asset.findOneAndUpdate(
        { userId, type: "Account" },
        { $inc: { currentValue: -amount } },
      );
    } else if (sourceType === "MutualFund") {
      await Asset.findOneAndUpdate(
        { userId, type: "Mutual Funds" },
        { $inc: { currentValue: -amount } },
      );

      await Asset.findOneAndUpdate(
        { userId, type: "Bank Account" },
        { $inc: { currentValue: amount } },
      );
    } else if (sourceType === "Stocks") {
      await Asset.findOneAndUpdate(
        { userId, type: "Stocks" },
        { $inc: { currentValue: -amount } },
      );
      await Asset.findOneAndUpdate(
        { userId, type: "Bank Account" },
        { $inc: { currentValue: amount } },
      );
    } else {
      await Asset.findOneAndUpdate(
        { userId, type: "Gold" },
        { $inc: { currentValue: -amount } },
      );

      await Asset.findOneAndUpdate(
        { userId, type: "Bank Account" },
        { $inc: { currentValue: amount } },
      );
    }

    res.json({
      success: true,
      security: req.security,
    });
  },
);

app.post("/adddebt", authMiddleware, async (req, res) => {
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

app.get("/getFinancialScore", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await Profile.findOne({ userId });
    const assets = await Asset.find({ userId });
    const debts = await Debt.find({ userId });

    const {
      monthlyIncome: salary,
      age,
      riskProfile,
      bills,
      food,
      health,
      obligations,
      lifestyle,
      misc,
      transport,
      savings,
    } = profile;

    const bankBalance = assets
      .filter((a) => a.type === "Bank Account")
      .reduce((sum, a) => sum + a.currentValue, 0);
    console.log(bankBalance);
    const investedAssets = assets
      .filter((a) =>
        ["Stocks", "Mutual Funds", "Gold", "Real Estate"].includes(a.type),
      )
      .reduce((sum, a) => sum + a.currentValue, 0);

    const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);

    const totalMonthlyEMI = debts.reduce((sum, d) => sum + d.monthlyEMI, 0);
    const totalRemainingBalance = debts.reduce(
      (sum, d) => sum + d.remainingBalance,
      0,
    );

    const breakdown = [];
    let score = 0;

    const savingsRate = savings / salary;
    const p1 = Math.min(20, Math.round((savingsRate / 0.2) * 20));
    score += p1;

    if (savingsRate >= 0.2) {
      breakdown.push("+ Excellent savings rate");
    } else if (savingsRate >= 0.1) {
      breakdown.push(`~ Savings rate is decent but below the 20% target`);
    } else {
      breakdown.push(
        "- Savings rate is low; aim to save at least 20% of income",
      );
    }

    const essentialExpenses = bills + food + health + obligations + transport;
    const emergencyMonths = bankBalance / essentialExpenses;
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
    if (discretionaryRate > 0.3) {
      const overshoot = discretionaryRate - 0.3;
      p3 = Math.max(0, Math.round(20 - (overshoot / 0.3) * 20));
    }
    score += p3;

    if (discretionaryRate <= 0.3) {
      breakdown.push("+ Lifestyle spending is well under control");
    } else if (discretionaryRate <= 0.5) {
      breakdown.push("~ Discretionary spending is above 30%, try to cut back");
    } else {
      breakdown.push(
        "- Lifestyle spending is excessive, review misc and lifestyle costs",
      );
    }

    const investmentRatio = investedAssets / totalAssets;
    const p4 = Math.min(20, Math.round((investmentRatio / 0.5) * 20));
    score += p4;

    if (investmentRatio >= 0.5) {
      breakdown.push(
        "+ Great investment allocation, wealth is actively growing",
      );
    } else if (investmentRatio >= 0.25) {
      breakdown.push("~ Some investments present but below the 50% target");
    } else {
      breakdown.push("- Most wealth is sitting idle, consider investing more");
    }

    const dtiRatio = totalMonthlyEMI / salary;
    const p5 = Math.max(0, Math.round(20 - (dtiRatio / 0.4) * 20));
    score += p5;

    if (dtiRatio === 0) {
      breakdown.push("+ Debt-free, no EMI burden on income");
    } else if (dtiRatio <= 0.2) {
      breakdown.push("~ EMI obligations are manageable");
    } else {
      breakdown.push(
        "- High EMI-to-income ratio, debt is straining your finances.",
      );
    }

    const badDebtKeywords = ["credit card", "personal loan"];
    const hasBadDebt = debts.some((d) =>
      badDebtKeywords.some((keyword) =>
        d.debtName.toLowerCase().includes(keyword),
      ),
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
      { upsert: true, new: true }, //upsert: true to update if it exists or create if it does not.
      // Also new: true returns the updated document and not the old document.
    );

    res.json({ score, breakdown });
  } catch (error) {
    console.error("Error in /getFinancialScore:", error);
  }
});

app.post("/chatbot", authMiddleware, async (req, res) => {
  const { message, history } = req.body;
  const data = await Finances.findOne({ userId: req.userId });
  const assets = await Asset.find({
    userId: req.userId,
    type: { $ne: "Bank Account" }, //To exclude bank account data, which we already fed from the finances collection.
  });
  const goals = await Goal.find({ userId: req.userId });
  const debt = await Debt.find({ userId: req.userId });
  const profile = await Profile.findOne({ userId: req.userId });

  const cleanedFinances = cleanFinances(data);
  const cleanedAssets = assets.map(cleanAsset);
  const cleanedGoals = goals.map(cleanGoals);
  const cleanedDebts = debt.map(cleanDebts);
  const cleanedProfile = cleanProfile(profile);

  const conversation = history
    .map((msg) => `${msg.role}: ${msg.text}`)
    .join("\n");

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
    `;
  console.log(content);

  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "gemma3:4b",
    prompt: content,
    stream: false,
  });

  const rawText = response.data.response;

  const cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\s*|```/g, "")
    .trim();

  res.json({
    finalData: cleaned,
  });
});

app.post("/askHisaab", authMiddleware, async (req, res) => {
  const { query } = req.body;
  console.log(query);
  const { assetType, fundName } = query;

  let mf = false;

  let fund,
    return1Y,
    return3Y,
    return5Y,
    returnInception,
    returnsDate,
    volatility,
    fundRating,
    fundRatingDate,
    crisilRating,
    investmentObjective,
    portfolioTurnover,
    aum,
    categoryAvg1Y,
    categoryAvg3Y,
    categoryAvg5Y,
    categoryAvgVolatility,
    categoryAvgExpenseRatio,
    bestPeer1Y,
    bestPeer3Y,
    bestPeer5Y,
    lowestVolatilityPeer,
    fundTags,
    comparisonCount;

  if (assetType == "MutualFund") {
    mf = true;

    // Fetch AMFI's official NAV file and fuzzy-match by fund name to get the ISIN directly
    // Format: SchemeCode;ISIN Growth;ISIN Reinvestment;Scheme Name;NAV;Date
    try {
      const amfiRes = await fetch(
        "https://www.amfiindia.com/spages/NAVAll.txt",
      );
      const amfiText = await amfiRes.text();
      const lines = amfiText.split("\n");

      const searchName = fundName.toLowerCase().trim();
      let bestMatch = null;
      let bestScore = 0;

      for (const line of lines) {
        if (!line.includes(";")) continue;
        const parts = line.split(";");
        if (parts.length < 4) continue;

        const schemeName = parts[3].trim().toLowerCase();
        // Skip non-Growth variants (IDCW, Bonus, etc.) to prefer Growth plans
        if (!schemeName.includes("growth")) continue;

        // Score: count how many words from the user's search appear in the scheme name
        const searchWords = searchName.split(/\s+/);
        const matchCount = searchWords.filter((w) =>
          schemeName.includes(w),
        ).length;
        const score = matchCount / searchWords.length;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = parts;
        }
      }

      if (bestMatch && bestScore >= 0.5) {
        const isin = (bestMatch[1] || bestMatch[2] || "")
          .trim()
          .replace(/-/g, "");
        if (isin && /^[A-Z0-9]{12}$/.test(isin)) {
          const url = `https://mf.captnemo.in/kuvera/${isin}`;
          try {
            const response = await fetch(url);
            const mfdata = await response.json();
            if (mfdata && mfdata[0]) {
              fund = mfdata[0];
            } else {
              console.error("Kuvera returned no data for ISIN:", isin);
              mf = false;
            }
          } catch (error) {
            console.error("Failed to fetch mutual fund data:", error);
            mf = false;
          }
        } else {
          console.log("No valid ISIN found for best match:", bestMatch[3]);
          mf = false;
        }
      } else {
        console.log("No matching fund found for:", fundName);
        mf = false;
      }
    } catch (error) {
      console.error("Failed to fetch AMFI data:", error);
      mf = false;
    }
  }
  if (mf && fund) {
    ({
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
    } = fund);

    ({
      crisil_rating: crisilRating,
      investment_objective: investmentObjective,
      portfolio_turnover: portfolioTurnover,
      aum,
    } = fund);

    const comparison = fund.comparison ?? [];
    comparisonCount = comparison.length;
    fundTags = fund.tags ?? [];

    const categoryAvg = (key) => {
      const valid = comparison.filter((f) => f[key]);
      const total = valid.reduce((sum, f) => sum + f[key], 0);
      const average = total / valid.length;
      return average.toFixed(2);
    };

    categoryAvg1Y = categoryAvg("1y");
    categoryAvg3Y = categoryAvg("3y");
    categoryAvg5Y = categoryAvg("5y");
    categoryAvgVolatility = categoryAvg("volatility");
    categoryAvgExpenseRatio = categoryAvg("expense_ratio");

    bestPeer1Y = [...comparison].sort((a, b) => b["1y"] - a["1y"])[0];
    bestPeer3Y = [...comparison].sort((a, b) => b["3y"] - a["3y"])[0];
    bestPeer5Y = [...comparison].sort((a, b) => b["5y"] - a["5y"])[0];
    lowestVolatilityPeer = [...comparison].sort(
      (a, b) => a["volatility"] - b["volatility"],
    )[0];
  }

  let detes;
  if (assetType == "Stocks") {
    const stock = await fetch(
      `https://stock.indianapi.in/stock?name=${encodeURIComponent(fundName)}`,
      {
        headers: {
          "x-api-key": process.env.STOCK_API_KEY,
        },
      },
    );
    const jsonStock = await stock.json();
    detes = extractStockContext(jsonStock);
  }

  const data = await Finances.findOne({ userId: req.userId });
  const assets = await Asset.find({
    userId: req.userId,
    type: { $ne: "Bank Account" },
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
You are Hisaab, a strict, numbers-first personal finance advisor for a retail investor in India. All monetary values are in INR. Every claim you make must trace back to a specific number or fact given below — no vague reassurance, no generic encouragement.

## Transaction Requested
${JSON.stringify(query, null, 2)}

## User's Financial Snapshot
When reading the JSON below, pay particular attention to: current bank balance, total net worth, total invested assets, savings rate, total monthly EMI/debt obligations, and each goal's priority level and target date. These are the figures Steps 1 and 2 ask you to reason about.

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

${
  mf
    ? `
## Mutual Fund Details
Applies only because assetType is "MutualFund". Use the 1Y/3Y/5Y returns, volatility, category comparison, fund rating, and platform signals below as your evidence. Never cite AUM or portfolio turnover in "reason" — background only. Expense ratio is background UNLESS it exceeds category average by more than 0.5%, in which case it becomes a valid factor.

If any figure below reads "NaN", "undefined", "N/A", or is otherwise not a real number, treat that specific metric as unavailable — do not reference it, and do not treat a missing figure as zero or as evidence of underperformance.

Name: ${fund.name}
Category: ${fund.fund_category} (${fund.fund_type})
AUM: ₹${aum} Lakhs
Expense Ratio: ${fund.expense_ratio}%
Portfolio Turnover: ${portfolioTurnover}
Investment Objective: ${investmentObjective}

Performance (as of ${returnsDate}):
  1-Year Return: ${return1Y}%
  3-Year Return: ${return3Y}%
  5-Year Return: ${return5Y}%
  Since Inception: ${returnInception}%

Risk & Rating:
  Volatility: ${volatility}%
  CRISIL Rating: ${crisilRating}
  Fund Rating: ${fundRating}/5 (as of ${fundRatingDate}) — an independent quality signal, not derived from the returns above. A 4 or 5 rating is meaningful positive evidence; weigh it against a small category-average gap rather than ignoring it.

Platform Signals: ${fundTags.length > 0 ? fundTags.join(", ") : "none available"}
  Treat "top_rated" and "top_bought" as mild independent positive evidence, particularly when return-based numbers are mixed or only marginally below average.

Category Comparison (${fund.fund_category} peers, averaged across ${comparisonCount} fund${comparisonCount === 1 ? "" : "s"}):
${
  comparisonCount > 0
    ? `  Metric        This Fund   Category Avg
  1Y Return     ${return1Y}%        ${categoryAvg1Y}%
  3Y Return     ${return3Y}%        ${categoryAvg3Y}%
  5Y Return     ${return5Y}%        ${categoryAvg5Y}%
  Volatility    ${volatility}%      ${categoryAvgVolatility}%
  Expense Ratio ${fund.expense_ratio}%   ${categoryAvgExpenseRatio}%

Standout peers (background only — do not cite unless the chosen fund is a clear outlier against one of these):
  Best 1Y: ${bestPeer1Y?.short_name ?? "n/a"} at ${bestPeer1Y?.["1y"] ?? "n/a"}%
  Best 3Y: ${bestPeer3Y?.short_name ?? "n/a"} at ${bestPeer3Y?.["3y"] ?? "n/a"}%
  Best 5Y: ${bestPeer5Y?.short_name ?? "n/a"} at ${bestPeer5Y?.["5y"] ?? "n/a"}%
  Lowest volatility: ${lowestVolatilityPeer?.short_name ?? "n/a"} at ${lowestVolatilityPeer?.volatility ?? "n/a"}%`
    : `  No peer funds are available in this category — there is no benchmark to compare against. Evaluate this fund only on its own returns, volatility, and fund rating.`
}
`
    : ""
}

${
  detes
    ? `
## Stock Details
Applies only because assetType is "Stocks". Use ONLY current price vs. 52-week range, analyst consensus mean score, and today's/YTD % change as evidence. Market cap and industry are background only — never cite them in "reason".

Company: ${detes.companyName} (${detes.industry})
Current Price: ₹${detes.currentPrice.NSE} (NSE) / ₹${detes.currentPrice.BSE} (BSE)
Day Change: ${detes.percentChange}%
52-Week Range: ₹${detes.yearLow} – ₹${detes.yearHigh}
YTD Change: ${detes.ytdChange}%
Market Cap: ₹${detes.marketCap} Cr
Risk Profile: ${detes.risk} (the stock's own inherent volatility category — not the same as the transaction "risk" you output in Step 3, though it is one input to it)

Analyst Consensus (${detes.analystConsensus.noOfRecommendations} analysts):
  Rating: ${detes.analystConsensus.averageRating}
  Mean Score: ${detes.analystConsensus.meanValue.toFixed(2)} / 5 (1 = Strong Buy, 5 = Strong Sell)

Materiality rule for this stock:
  - Mean score ≤ 2.0: treat analyst sentiment as a positive factor.
  - Mean score 2.0–3.5: neutral/mixed — do not let this alone drive a NO.
  - Mean score > 3.5: treat as a negative factor worth citing.
  - Today's ${detes.percentChange}% move is noise, not signal, unless it exceeds ±5%, in which case it becomes feasibility-relevant.

Recent News (cite the single most decision-relevant headline only if it directly affects feasibility or risk — do not cite news just because it exists):
${detes.recentNews
  .map(
    (n, i) => `  ${i + 1}. ${n.headline} (${new Date(n.date).toDateString()})`,
  )
  .join("\n")}
`
    : ""
}

${
  !mf && !detes
    ? `
## Note
assetType is "${assetType}". No fund-specific or stock-specific performance, volatility, or risk data exists for this transaction — either none applies, or (for MutualFund) the lookup failed. Do not invent, estimate, or reference performance/volatility/risk figures that were not given to you. Evaluate this transaction purely on bank balance, net worth impact, and progress toward Goals/Debts in the snapshot above.
`
    : ""
}

## How to Decide
Work through the three steps below internally. Do not show your steps, reasoning, or working in the output — only the final JSON.

**Step 1 — Feasibility (a hard gate).**
Can this transaction actually happen — bank balance, existing holdings, lock-in periods? If it clearly cannot, stop here: decision is NO, risk is HIGH, and "reason" cites the specific feasibility number that fails.
${mf ? `Fund check: 1Y return ${return1Y}% vs category avg ${categoryAvg1Y}%; volatility ${volatility}% vs category avg ${categoryAvgVolatility}%.` : ""}
${detes ? `Stock check: current price ₹${detes.currentPrice.NSE} within a 52-week range of ₹${detes.yearLow}–₹${detes.yearHigh}; risk profile ${detes.risk}. Confirm bank balance covers the purchase.` : ""}
${!mf && !detes ? `Check only bank balance sufficiency and any relevant existing holdings — there is no fund/stock performance data to weigh here.` : ""}

**Step 2 — Impact (only if Step 1 passes).**
Estimate net worth, invested assets, bank balance, and savings rate after this transaction. Weigh the opportunity cost. Check the effect on progress toward Goals — especially high-priority goals with near deadlines — and on Debts/total monthly EMI, including the emergency fund.

If query.reason is a non-empty string that clearly describes discretionary/consumption spending, prefer wealth-building over consumption unless the amount is small relative to discretionary capacity in the Monthly Profile. If query.reason is empty, missing, or purely descriptive (e.g. "SIP", "investment"), skip this check — an empty reason is not evidence of discretionary intent.

${
  mf
    ? comparisonCount > 0
      ? `Fund-specific: 3Y return of ${return3Y}% is ${(return3Y - categoryAvg3Y).toFixed(2)}% ${return3Y >= categoryAvg3Y ? "above" : "below"} category avg (${categoryAvg3Y}%). Volatility of ${volatility}% is ${(volatility - categoryAvgVolatility).toFixed(2)}% ${volatility <= categoryAvgVolatility ? "below" : "above"} category avg (${categoryAvgVolatility}%). Weight the 5-year return most heavily of the three horizons — treat 1Y and 3Y as secondary confirmation, not primary evidence.

Materiality rule: a 5Y-return gap under 2 percentage points is NOT on its own grounds for NO — treat it as roughly comparable performance, especially if fund_rating is 4-5 or platform signals include "top_rated"/"top_bought". In that case, let bank balance, goal timeline, and risk profile carry the decision instead. Only treat 5Y underperformance as the primary rejection reason when the gap is 2+ points, or when 1Y, 3Y, and 5Y all underperform in the same direction — not when a single window lags while the others are competitive.`
      : `Fund-specific: no category benchmark exists for this fund, so base your view on its own 5-year return of ${return5Y}%, volatility of ${volatility}%, and fund rating of ${fundRating}/5 rather than a peer comparison.`
    : ""
}
${detes ? `Stock-specific: analyst consensus is "${detes.analystConsensus.averageRating}" (mean ${detes.analystConsensus.meanValue.toFixed(2)}/5 across ${detes.analystConsensus.noOfRecommendations} analysts) — apply the materiality rule above. Factor in recent news sentiment and the ${detes.risk} risk profile.` : ""}

**Step 3 — Deciding factor and risk rating.**
Identify the single factor that most influenced your decision: either the Step 1 feasibility number (if feasibility was genuinely at risk) or the single most decisive Step 2 number (if feasibility was clearly fine). Never combine a Step 1 number and a Step 2 number in "reason". AUM, portfolio turnover, market cap, comparisonCount, Standout peers (unless the fund is a clear outlier), and expense ratio (unless flagged above) must never be the deciding factor or appear in "reason". fund_rating and platform tags may be the deciding factor only when they tip a close call under the materiality rule above — if so, name the rating or tag directly instead of a return-gap number.

Set "risk" using this rubric (risk to the user's financial position from this transaction — not the same as any asset-level Risk Profile label above, though that label is one input):
  - HIGH: Step 1 failed, OR the transaction meaningfully strains the emergency fund/debt servicing, OR pushes a near-deadline high-priority goal off track.
  - MEDIUM: feasible with a real but recoverable dent in savings rate or buffer, or the fund/stock evidence is genuinely mixed.
  - LOW: comfortably affordable with minimal effect on goals, debt servicing, or emergency fund, and the fund/stock evidence is neutral-to-positive.

"alternative" must be one concrete, actionable adjustment — a smaller amount, a different fund/asset, or a timing change — never generic advice like "consult a financial advisor" or "do more research".

## Output Format
Respond with nothing but a single valid JSON object. No markdown, no code fences, no <think> tags, no reasoning, no preamble, no text before { or after }. Your entire response must start with { and end with }.

"reason" states the Step 3 deciding factor plus the one number or name that proves it — max 25 words, no generic advice, no second number from a different step.
"alternative" follows the rule above — max 20 words.
Be decisive: choose "YES" or "NO" with no hedging.

{
  "decision": "<YES or NO>",
  "risk": "<LOW, MEDIUM, or HIGH>",
  "reason": "<max 25 words, states the Step 3 deciding factor and its number>",
  "alternative": "<max 20 words, one concrete adjustment>"
}
`;

  console.log(content);
  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "qwen3:8b",
    prompt: content,
    stream: false,
  });

  const rawText = response.data.response;

  // Strip ```json ... ``` or plain ``` ... ``` fences
  const cleaned = rawText.replace(/```json\s*|```/g, "").trim();

  let parsedResult;
  try {
    parsedResult = JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse model output:", cleaned);
    return res.status(502).json({
      error: "Model returned invalid JSON",
      raw: rawText,
    });
  }

  res.json({
    finalData: parsedResult,
  });
});

app.post("/verify-otp-transaction", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { otp } = req.body;

  const result = await verifyOtp({
    userId,
    purpose: "transaction",
    submittedCode: otp,
  });

  if (!result.valid) {
    return res.status(400).json({ success: false, error: result.reason });
  }
  if (!result.pendingAction?.route) {
    return res
      .status(400)
      .json({ success: false, error: "No pending transaction to confirm." });
  }

  const handler = TRANSACTION_HANDLERS[result.pendingAction.route];
  if (!handler) {
    return res
      .status(400)
      .json({ success: false, error: "Unknown transaction type." });
  }

  try {
    await handler(userId, result.pendingAction.payload);
    return res.json({ success: true });
  } catch (err) {
    console.error("OTP-verified transaction failed:", err);
    return res
      .status(500)
      .json({ success: false, error: "Transaction failed." });
  }
});

app.post("/verify-otp-login", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const result = await verifyOtp({
    userId: user._id,
    purpose: "login",
    submittedCode: otp,
  });
  if (!result.valid) {
    return res.status(400).json({ success: false, error: result.reason });
  }

  const refreshToken = createRefreshToken(user.id);
  const accessToken = createAccessToken(user.id);
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  user.refreshToken = hashedToken;
  await user.save();
  sendRefreshToken(res, refreshToken);
  res.json({
    accessToken,
    email: user.email,
    name: user.name,
    userId: user._id,
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));