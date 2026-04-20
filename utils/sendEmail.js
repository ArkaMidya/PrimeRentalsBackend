const sendEmail = async (options) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('CRITICAL ERROR: RESEND_API_KEY environment variable is missing!');
    throw new Error('Email service is not configured on the server.');
  }

  try {
    console.log(`DEBUG: Sending email via Resend API to: ${options.email}...`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Car Rental <onboarding@resend.dev>',
        to: options.email,
        subject: options.subject,
        text: options.message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API Error:', data);
      throw new Error(data.message || 'Failed to send email via Resend');
    }

    console.log(`Email sent successfully via Resend. ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Email could not be sent: ' + error.message);
  }
};

module.exports = sendEmail;
