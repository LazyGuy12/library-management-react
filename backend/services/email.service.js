// services/email.service.js
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    // Cấu hình này thường để trong file .env
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: '"Thư Viện HUTECH" <noreply@library.com>',
        to,
        subject,
        text
    });
};

module.exports = { sendEmail };