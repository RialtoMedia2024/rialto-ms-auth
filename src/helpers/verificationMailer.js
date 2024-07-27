const axios = require("axios");
const jwt = require("jsonwebtoken");


async function sendEmailVerificationMail (userId, email, name) {
  try{
    console.log ("sendEmailVerificationMail", userId, email);
    const emailService = process.env.MS_COMMUNICATION_SERVICE_URL;
    const url = `${emailService}/verify/email`;

    const verifyToken = jwt.sign(
      { userId: userId, email: email },
      process.env.JWT_SECRET,
      { expiresIn: "5d" }
    );

    console.log ("sendEmailVerificationMail : Token genarted: ", verifyToken);
    let response = await axios({
        method: "post",
        url: url,
        headers: {
          "content-type": "application/json",
        },
        data: {
          payload: {
            name: name,
            email: email,
            verifyToken: verifyToken,
            verifyUrl: process.env.EMAIL_VERIFY_URL+verifyToken
          },
        },
    });

    console.log ("sendEmailVerificationMail: response from mailer: ", response)
    return true;
  }
  catch(err){
    console.log ("ERROR : Failed to send Verification email: ", err);
    return false ;
  }
}


module.exports.sendEmailVerificationMail = sendEmailVerificationMail;
