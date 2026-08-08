const PDFDocument = require("pdfkit");
const Transaction = require("../models/transactions");
const User = require("../models/user");
const Profile = require("../models/profile");

async function downloadIncidentReport(req, res) {
  const transactionId = req.query.id;
  const explanation = req.body?.explanation?.trim();

  let transaction, user, profile;
  try {
    transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    const userId = transaction.userId;

    user = await User.findById(userId).select(
      "name email behavioralBaseline.averageTransactionAmount",
    );

    profile = await Profile.findOne({ userId }).select("number riskProfile");
  } catch (err) {
    console.error("Error fetching data for incident report:", err);
    return res.status(500).json({ message: "Failed to fetch report data." });
  }

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="incident-report.pdf"',
  );

  doc.pipe(res);

  doc.font("Times-Bold").fontSize(40).fillColor("#0033cc").text("Lekha", {
    width: 500,
    align: "center",
  });

  doc.fillColor("black");

  doc.moveDown(0.3);

  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();

  doc.moveDown(0.3);

  doc.font("Times-Bold").fontSize(16).text("FRAUD INCIDENT REPORT", {
    width: 500,
    align: "center",
  });

  doc.moveDown(0.3);

  doc
    .font("Times-Roman")
    .fontSize(9)
    .fillColor("#555555")
    .text(`Generated on ${new Date().toLocaleString("en-IN")}`, {
      width: 500,
      align: "center",
    });
  doc.fillColor("black");

  doc.moveDown(0.5);

  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();

  doc.moveDown(1);

  const labelValueRow = (label, value) => {
    const labelWidth = 160;
    const startX = doc.page.margins.left;
    const startY = doc.y;

    doc.font("Times-Bold").fontSize(11).text(label, startX, startY, {
      width: labelWidth,
      continued: false,
    });
    doc
      .font("Times-Roman")
      .fontSize(11)
      .text(
        value !== undefined && value !== null && value !== ""
          ? String(value)
          : "Not provided",
        startX + labelWidth,
        startY,
        { width: 500 - labelWidth },
      );
    doc.moveDown(0.4);
  };

  doc.font("Times-Bold").fontSize(13).text("Complainant Details");
  doc.moveDown(0.3);

  labelValueRow("Name:", user?.name);
  labelValueRow("Email:", user?.email);
  labelValueRow("Phone:", profile?.number);
  labelValueRow("User Reference ID:", transaction.userId);

  doc.moveDown(0.7);

  doc.font("Times-Bold").fontSize(13).text("Transaction Details");
  doc.moveDown(0.3);

  labelValueRow("Transaction ID:", transaction._id);
  labelValueRow("Type:", transaction.type);
  labelValueRow("Amount:", `Rs. ${transaction.amount}`);
  labelValueRow("Category:", transaction.category);
  labelValueRow("Status:", transaction.status);
  labelValueRow(
    "Date & Time:",
    new Date(transaction.createdAt).toLocaleString("en-IN"),
  );

  doc.moveDown(0.7);

  doc.font("Times-Bold").fontSize(13).text("Incident Description");
  doc.moveDown(0.3);
  doc
    .font("Times-Roman")
    .fontSize(11)
    .text(
      explanation
        ? explanation
        : "Not provided — no incident description was recorded for this transaction.",
      { width: 500 },
    );

  doc.moveDown(0.7);

  doc.font("Times-Bold").fontSize(13).text("System-Generated Risk Analysis");
  doc.moveDown(0.2);
  doc
    .font("Times-Roman")
    .fontSize(9)
    .fillColor("#555555")
    .text(
      "The following signals were flagged automatically by Lekha's fraud-detection system and reflect algorithmic analysis, not a verified finding of fraud.",
      { width: 400 },
    );
  doc.fillColor("black");
  doc.moveDown(0.3);

  labelValueRow("Risk Score:", `${transaction.riskScore} / 100`);
  labelValueRow("User's Risk Profile:", profile?.riskProfile);
  labelValueRow(
    "User's Average Transaction:",
    user?.behavioralBaseline?.averageTransactionAmount !== undefined
      ? `Rs. ${user.behavioralBaseline.averageTransactionAmount}`
      : null,
  );

  doc.font("Times-Bold").fontSize(11).text("Flagged Signals:");
  doc.moveDown(0.2);

  const riskReasons =
    Array.isArray(transaction.riskReasons) && transaction.riskReasons.length
      ? transaction.riskReasons
      : ["No specific risk signals were recorded."];

  riskReasons.forEach((reason) => {
    doc
      .font("Times-Roman")
      .fontSize(11)
      .text(`\u2022 ${reason}`, doc.page.margins.left + 15, doc.y, {
        width: 470,
      });
    doc.moveDown(0.15);
  });

  doc.moveDown(0.5);

  labelValueRow("Security Decision:", transaction.securityDecision);
  labelValueRow("Duress Detected:", transaction.isDuress ? "Yes" : "No");

  doc.moveDown(0.7);

  const boxStartY = doc.y;
  doc.font("Times-Bold").fontSize(13).text("Suggested Next Steps");
  doc.moveDown(0.3);

  const steps = [
    "Call 1930 — the National Cyber Fraud Helpline — as soon as possible to report financial fraud.",
    "File a complaint at cybercrime.gov.in, the National Cyber Crime Reporting Portal.",
    "Contact our fraud/dispute team.",
  ];

  steps.forEach((step) => {
    doc
      .font("Times-Roman")
      .fontSize(11)
      .text(`\u2022 ${step}`, doc.page.margins.left + 15, doc.y, {
        width: 470,
      });
    doc.moveDown(0.2);
  });

  const boxEndY = doc.y;
  doc
    .rect(
      doc.page.margins.left - 5,
      boxStartY - 5,
      doc.page.width - doc.page.margins.left - doc.page.margins.right + 10,
      boxEndY - boxStartY + 5,
    )
    .stroke();

  doc.moveDown(1);

  const disclaimerText =
    "This is a self-generated incident summary produced by Lekha to assist the user in filing a report with the appropriate authorities. It is not an official government form and does not constitute submission to any authority, bank, or law enforcement agency.";

  doc.font("Times-Italic").fontSize(8);
  const disclaimerHeight = doc.heightOfString(disclaimerText, { width: 500 });

  const spaceNeeded = 10 + 5 + disclaimerHeight;

  if (doc.y + spaceNeeded > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }

  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.3);

  doc
    .font("Times-Italic")
    .fontSize(8)
    .fillColor("#555555")
    .text(disclaimerText, { width: 500 });

  doc.end();
}

module.exports = downloadIncidentReport;
