import nodemailer from "nodemailer";

const sendMail = async (to, subject, text, html = null) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: {
      name: "swapna@drcsystems.com",
      address: "no-reply@gmail.com",
    },
    to,
    subject,
    text,
    html,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending mail: ", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

export default sendMail;
