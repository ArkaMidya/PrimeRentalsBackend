require('dotenv').config();

async function testResend() {
  console.log("Testing Resend API with Key:", process.env.RESEND_API_KEY ? "EXISTS" : "MISSING");
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'arkamidya516@gmail.com', // Must be the email you signed up with for Resend
        subject: 'Test connection',
        text: 'This is a test from Resend API!',
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log("SUCCESS: Email sent via Resend API!", data);
    } else {
      console.error("FAILED: Resend API error", data);
    }
  } catch (error) {
    console.error("FAILED: ", error);
  }
}

testResend();
