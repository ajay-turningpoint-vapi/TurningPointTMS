const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail", // Use your email service provider
  auth: {
    user: "ajay@turningpointvapi.com",
    pass: "ajayturningpointvapi2024",
  },
});

const sendMail = (to, subject, text) => {
  const mailOptions = {
    from: "ajay@turningpointvapi.com",
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log("Error sending email:", err);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

module.exports = sendMail;
