require('dotenv').config();
const nodemailer = require('nodemailer');

async function testConnection() {
  console.log("Testing with User:", process.env.EMAIL_USER);
  console.log("Testing with Pass Length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("SUCCESS: SMTP connection verified!");
  } catch (error) {
    console.error("FAILED: ", error);
  }
}

testConnection();
