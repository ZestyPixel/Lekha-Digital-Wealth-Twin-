const User = require("../models/user");
const mongoose = require("mongoose");
const { formatCurrency } = require("../utils/dataCleaning");
const { generateOtpCode, storeOtp } = require("../utils/otpService");
const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
const { google } = require("googleapis");
const MailComposer = require("nodemailer/lib/mail-composer");

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

// Add location check, transaction frequency, device fingerprint, failed login attempts
async function securityMiddleware(req, res, next) {
  try {
    const id = req.userId;
    let {
      amount,
      assetType,
      fundName,
      transactionType,
      destinationType,
      destAccountNumber,
      destIfsc,
      destBankName,
      transactionDate,
      reason,
      purchaseDate,
    } = req.body;
    let device = false;
    let riskScore = 0;
    let reasons = [];
    const user = await User.findById(id);
    const { email } = user;

    const loginGap = Date.now() - user.behavioralBaseline.lastLoginTime;
    if (loginGap / 1000 < 20) {
      riskScore += 25;
      reasons.push("Action too fast after login");
    }

    if (!device) {
      //user.behaviouralBaseline.trustedDevices.includes(device)
      riskScore += 10;
      reasons.push("New device detected");
    }

    const hour = new Date().getHours();
    if (hour >= 0 && hour <= 6) {
      riskScore += 20;
      reasons.push("Unusual late-night transaction");
    }

    if (amount > 2 * user.behavioralBaseline.averageTransactionAmount) {
      riskScore += 25;
      reasons.push("Unusual transaction amount");
    }

    // if (user.otpAttempts > 2) {
    //     riskScore += 20;
    //     reasons.push("Multiple OTP attempts");
    // }

    if (amount % 10000 === 0) {
      riskScore += 10;
      reasons.push("Round number transaction pattern");
    }

    let decision = "ALLOW";
    if (riskScore >= 50) {
      decision = "BLOCK";
    } else if (riskScore >= 40) {
      decision = "WARN";
    }

    let body;
    let subjectLine;
    const reasonList = reasons
      .map((reason) => `<b><li>${reason}</li></b>`)
      .join("");
    if (transactionType === "lumpsum") {
      if (decision === "ALLOW") {
        subjectLine = "✅ Transaction Successful !";
        body = ` Your lumpsum investment dated <b>${purchaseDate}</b> amounting <b>${formatCurrency(amount)}</b> in <b>${fundName}</b> has been 
                successfully processed. `;
      } else if (decision === "WARN") {
        subjectLine = "⚠️ Transaction Blocked Temporarily !";
        body = ` Your lumpsum investment dated <b>${purchaseDate}</b> amounting <b>${formatCurrency(amount)}</b> in <b>${fundName}</b> has been 
                temporarily blocked due to ${reasonList}
                Please review this immediately and block if this transaction was not made by you.
                `;
      } else {
        subjectLine = "🚨 Transaction Blocked !";
        body = ` Your lumpsum investment dated <b>${purchaseDate}</b> amounting <b>${formatCurrency(amount)}</b> in <b>${fundName}</b> has been 
                blocked due to ${reasonList}
                Please review this immediately or contact support if you believe this is an error.
                `;
      }
    } else if (transactionType === "sip") {
      if (decision === "ALLOW") {
        subjectLine = "✅ Transaction Successful !";
        body = ` Your SIP registration request dated <b>${purchaseDate}</b> amounting <b>${formatCurrency(amount)}</b> in <b>${fundName}</b> has 
                been successfully processed. `;
      } else if (decision === "WARN") {
        subjectLine = "⚠️ Transaction Blocked Temporarily !";
        body = ` Your SIP registration request dated <b>${purchaseDate}</b> amounting <b>${formatCurrency(amount)}</b> in <b>${fundName}</b> has 
                been temporarily blocked due to ${reasonList}
                Please review this immediately and block if this transaction was not made by you. Otherwise
                `;
      } else {
        subjectLine = "🚨 Transaction Blocked !";
        body = ` Your SIP registration request dated <b>${purchaseDate}</b> amounting <b>${formatCurrency(amount)}</b> in <b>${fundName}</b> has 
                been blocked due to ${reasonList}
                Please review the transaction or contact support if you believe this is an error.
                `;
      }
    } else if (transactionType === "Transfer") {
      if (decision === "ALLOW") {
        subjectLine = "✅ Transaction Successful !";
        body = ` Your bank transfer dated <b>${purchaseDate}</b> amounting <b>${formatCurrency(amount)}</b> to Account Number: 
                <b>${destAccountNumber}</b>, IFSC: <b>${destIfsc}, Bank: <b>${destBankName} has been successfully processed. `;
      } else if (decision === "WARN") {
        subjectLine = "⚠️ Transaction Blocked Temporarily !";
        body = ` Your bank transfer dated <b>${purchaseDate}</b> amounting <b>${formatCurrency(amount)}</b> to 
                Account Number: <b>${destAccountNumber}</b>, IFSC: <b>${destIfsc}</b>, Bank: <b>${destBankName}</b> has been temporarily blocked due to ${reasonList}
                Please review this immediately and block if this transaction was not made by you. Otherwise
                `;
      } else {
        subjectLine = "🚨 Transaction Blocked !";
        body = ` Your bank transfer dated${purchaseDate} amounting <b>${formatCurrency(amount)} to 
                Account Number: <b>${destAccountNumber}</b>, IFSC: <b>${destIfsc}</b>, Bank: <b>${destBankName}</b> has been blocked due to ${reasonList}
                Please review the transaction or contact support if you believe this is an error.
                `;
      }
    } else {
      if (decision === "ALLOW") {
        subjectLine = "✅ Transaction Successful !";
        body = ` Your redemption request dated <b>${transactionDate}</b> amounting <b>${formatCurrency(amount)}</b> from <b>${fundName}</b> has 
                been successfully processed. `;
      } else if (decision === "WARN") {
        subjectLine = "⚠️ Transaction Blocked Temporarily !";
        body = ` Your redemption request dated <b>${transactionDate}</b> amounting <b>${formatCurrency(amount)}</b> from <b>${fundName}</b> has 
                been temporarily blocked due to ${reasonList}
                Please review this immediately and block if this transaction was not made by you.
                `;
      } else {
        subjectLine = "🚨 Transaction Blocked !";
        body = ` Your redemption request dated <b>${transactionDate}</b> amounting <b>${formatCurrency(amount)}</b> in <b>${fundName}</b> has been 
                blocked due to ${reasonList}
                Please review the transaction or contact support if you believe this is an error.
                `;
      }
    }

    let otpCode = null;
    if (decision === "WARN" || decision === "BLOCK") {
      otpCode = generateOtpCode();
      body += `
                <p>Your verification code to confirm this transaction is:
                <b style="font-size: 18px; letter-spacing: 2px;">${otpCode}</b></p>
                <p>This code expires in 5 minutes.</p>
            `;
    }

    try {
      const mail = new MailComposer({
        from: `"Hisaab: Your Finance Assistant" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: subjectLine,
        html: body,
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
      console.log("Email sent");
    } catch (error) {
      console.error("Error sending email", error);
    }

    if (otpCode) {
      await storeOtp({
        userId: id,
        plainCode: otpCode,
        purpose: "transaction",
        pendingAction: { route: req.originalUrl, payload: req.body },
      });
    }

    req.security = {
      riskScore,
      decision,
      reasons,
    };

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Security middleware failed" });
  }
}

module.exports = securityMiddleware;
