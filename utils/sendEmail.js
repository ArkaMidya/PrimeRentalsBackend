const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('CRITICAL ERROR: EMAIL_USER or EMAIL_PASS environment variables are missing!');
    throw new Error('Email credentials are not configured on the server.');
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Car Rental App" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    console.log(`Attempting to send email to: ${options.email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check if EMAIL_PASS is a valid App Password and EMAIL_USER is correct.');
    }
    throw new Error('Email could not be sent: ' + error.message);
  }
};

module.exports = sendEmail;
