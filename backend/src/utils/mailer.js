const nodemailer = require("nodemailer");

// ✅ On lit les variables de TON .env (MAIL_*)
const user = process.env.MAIL_USER;
const pass = process.env.MAIL_PASS;

if (!user || !pass) {
  console.log("❌ MAIL_USER ou MAIL_PASS manquant dans .env");
  console.log("MAIL_USER =", user);
  console.log("MAIL_PASS =", pass ? "OK (hidden)" : "MISSING");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

async function sendMail(to, subject, html) {
  const from = process.env.MAIL_FROM || user;

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
