const nodemailer = require('nodemailer');

// Export a default handler function which Vercel will route properly
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, phone, email, service, message, otherDetail } = req.body;

    // Check credentials (should be set in Vercel Environment Variables)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(500).json({ success: false, message: 'Server configuration error: Missing credentials.' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const emailSubject = `Double Star Hire Request: ${service}`;
    const emailBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0F172A;">New Hire Request from Website</h2>
            <hr>
            <p><strong>Client Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Service Requested:</strong> ${service}</p>
            ${service === 'Other' ? `<p><strong>Specific Details:</strong> ${otherDetail}</p>` : ''}
            <p><strong>Message/Notes:</strong></p>
            <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #FFD700;">
                ${message || 'No additional message provided.'}
            </blockquote>
            <hr>
            <p style="font-size: 12px; color: #666;">This email was sent from the Double Star Engineering Services contact form.</p>
        </div>
    `;

    const mailOptions = {
        from: `"Double Star Website" <${process.env.EMAIL_USER}>`,
        to: process.env.RECIPIENT_EMAIL,
        replyTo: email,
        subject: emailSubject,
        html: emailBody
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send email.' });
    }
};
