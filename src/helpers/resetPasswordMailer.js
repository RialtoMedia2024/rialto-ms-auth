const axios = require("axios");
const jwt = require("jsonwebtoken");
const {RESET_PASSWORD_TOKEN} = require ("../configs/constants");


async function sendResetPasswordMail (resetPwd, email, name) {
  try{
    console.log ("sendResetPasswordMail", name, email);
    const emailService = process.env.MS_COMMUNICATION_SERVICE_URL;
    const url = `${emailService}/reset/password`;


    console.log ("sendResetPasswordMail : send mail to ", email);
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
            password: resetPwd,
          },
        },
    });

    console.log ("sendResetPasswordMail: response from mailer: ", response.response);
    return response;
  }
  catch(err){
    console.log ("ERROR : Failed to send Reset Password email: ", err);
    return null ;
  }
}


module.exports.sendResetPasswordMail = sendResetPasswordMail;
