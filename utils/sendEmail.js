const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_USER; // Use the verified email as sender

  if (!apiKey) {
    console.error('CRITICAL ERROR: BREVO_API_KEY environment variable is missing!');
    throw new Error('Email service is not configured on the server.');
  }

  try {
    console.log(`DEBUG: Sending email via Brevo API to: ${options.email}...`);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { 
          name: 'Car Rental App', 
          email: senderEmail 
        },
        to: [{ 
          email: options.email 
        }],
        subject: options.subject,
        textContent: options.message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error:', data);
      throw new Error(data.message || 'Failed to send email via Brevo');
    }

    console.log(`Email sent successfully via Brevo. Message ID: ${data.messageId}`);
    return data;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Email could not be sent: ' + error.message);
  }
};

module.exports = sendEmail;
