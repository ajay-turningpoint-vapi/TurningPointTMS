const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your email service provider
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password'
  }
});

const sendMail = (to, subject, text) => {
  const mailOptions = {
    from: 'your_email@gmail.com',
    to,
    subject,
    text
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log('Error sending email:', err);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = sendMail;
