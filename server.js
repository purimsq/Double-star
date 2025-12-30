require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // Required for file paths

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files

// Explicitly serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Route to handle email sending
app.post('/api/send-email', (req, res) => {
    const { name, phone, email, service, message, otherDetail } = req.body;

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
        replyTo: email, // Reply directly to the client
        subject: emailSubject,
        html: emailBody
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ success: false, message: 'Failed to send email. Please try again later.' });
        }
        console.log('Email sent: ' + info.response);
        res.status(200).json({ success: true, message: 'Email sent successfully!' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
