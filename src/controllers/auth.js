const User = require("../models/user");
const UserOTP = require("../models/userOTP");
const jwt = require("jsonwebtoken"); // to generate signed token
const expressJwt = require("express-jwt"); // for authorization check
const { errorHandler } = require("../helpers/dbErrorHandler");
const STATUS_CODE = require("../configs/errors");
const CONSTANTS = require("../configs/constants");
const axios = require("axios");
const { sendEmailVerificationMail } = require("../helpers/verificationMailer");
const { generatePwd } = require("../helpers/randomPwdGenerator");
const { sendResetPasswordMail } = require("../helpers/resetPasswordMailer");
const FileService = require("./../helpers/fileService");
const publisher = require("../publisher/publisher");
const logger = require("../logger/logger.js");


class AuthController {
  // using async/await

  async sendSignUpOTP(req, resp) {
    try {
      const { mobile } = req.body;
      logger.info("AuthController.sendSignUpOTP()", mobile);

      User.findOne({ mobile }, async (err, user) => {
        if (err) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            respcode: Object.keys(STATUS_CODE.MOBILE_ALREADY_REGISTERED)[0],
            message: STATUS_CODE.MOBILE_ALREADY_REGISTERED,
          });
        }if(user!== null){
          var registerdUserOrNot = true
        }else{
          var registerdUserOrNot = false
        }

        const otpservice = process.env.MS_COMMUNICATION_SERVICE_URL;

        const url = `${otpservice}/otp/signup`;

        // Fetch OTP from the communication
        let respData = undefined;

        let response = await axios({
          method: "post",
          url: url,
          headers: {
            "content-type": "application/json",
          },
          data: {
            payload: {
              mobile: mobile,
            },
          },
        });

        logger.info("AuthController.sendSignUpOTP()", response.data);
        respData = response.data;

        if (respData != undefined && respData.payload.error == false) {
          const otp = respData.payload ? respData.payload.otp : undefined;

          logger.info("AuthController.sendSignUpOTP() saveOtP", otp);

          // Store the OTP for further usage
          const newUserOTP = new UserOTP({
            mobile: mobile,
            otp: otp,
            otpType: "SIGNUP",
            validity: Date.now() + 86400000,
          });

          newUserOTP.save().then((oUserOTP) => {
            console.log(
              "AuthController.sendSignUpOTP() User OTP for sign up Save",
              oUserOTP
            );

            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              respcode: Object.keys(STATUS_CODE.SIGNUP_OTP_SEND_SUCCESS)[0],
              message: {message:STATUS_CODE.SIGNUP_OTP_SEND_SUCCESS,isUserRegistered:registerdUserOrNot},

            });
          });
        } else {
          logger.info("OTP not received");
          return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
            error: true,
            respcode: Object.keys(STATUS_CODE.SIGNUP_OTP_SEND_FAILED)[0],
            message: STATUS_CODE.SIGNUP_OTP_SEND_FAILED,
          });
        }
      });
    } catch (err) {
      logger.error("ERROR : ", err.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        respcode: Object.keys(STATUS_CODE.SIGNUP_OTP_SEND_FAILED)[0],
        message: STATUS_CODE.SIGNUP_OTP_SEND_FAILED,
      });
    }
  }

  async vaidateSignUpOTP(req, resp) {
    try {
      const { mobile, otp, name } = req.body;
      logger.info("AuthController.vaidateSignUpOTP()", req.body, mobile, otp);
      const otpType = "SIGNUP";

      UserOTP.findOne(
        { mobile, otpType, validity: { $gte: Date.now() } },
        null,
        { sort: { createdAt: -1 } },
        (err, userOTP) => {
          if (err || !userOTP) {
            logger.error(
              "AuthController.vaidateSignUpOTP() : Could not find entry..",
              err,
              userOTP
            );
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              error: true,
              respcode: Object.keys(STATUS_CODE.SIGNUP_MISSING_OTP)[0],
              message: STATUS_CODE.SIGNUP_MISSING_OTP,
            });
          }

          if (!userOTP.validateOTP(otp)) {
            logger.error(
              "AuthController.vaidateSignUpOTP() : Could not validate OTP",
              userOTP
            );
            return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
              error: true,
              respcode: Object.keys(STATUS_CODE.SIGNUP_OTP_INVALID)[0],
              message: STATUS_CODE.SIGNUP_OTP_INVALID,
            });
          }

          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            respcode: Object.keys(STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS)[0],
            message: STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS,
          });

        }
      );
    } catch (err) {
      logger.error("ERROR : AuthController.vaidateSignUpOTP() : ", err);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        respcode: Object.keys(STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS)[0],
        message: STATUS_CODE.VALIDATE_SIGNUP_OTP_FAILURE,
      });
    }
  }

  async signup(req, resp) {
    try {
      logger.info("AuthController.signup()", req.body);
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: true,
          message: STATUS_CODE.SIGNUP_FAILURE_EMAIL_EXISTS,
        });
      }
  
      const user = new User(req.body);
      logger.info("AuthController.signup()", user.email);
  
      await user.save();
      
      user.salt = undefined;
      user.hashed_password = undefined;
  
      resp.status(STATUS_CODE.SERVER_SUCCESS).json({
        error: false,
        respcode: Object.keys(STATUS_CODE.SIGNUP_SUCCESS)[0],
        message: STATUS_CODE.SIGNUP_SUCCESS,
        payload: { email: user.email },
      });
    } catch (err) {
      logger.error("ERROR : ", err.message);
      resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        respcode: Object.keys(STATUS_CODE.SIGNUP_FAILURE)[0],
        message: STATUS_CODE.SIGNUP_FAILURE,
      });
    }
  }
  

  /**
   * Api to sign up with mobile and no password after mobile is authenticated
   * @param {*} req
   * @param {*} resp
   * @returns
   */
  async signupWithMobile(req, resp) {
    const crmLeadId = req.body.crmLeadId;
    try {
      const user = await new User(req.body);
      const otp = req.body.otp;
      logger.info("AuthController.signupWithMobile()", req.body, user.mobile, otp,user.crmLeadId);

      const otpType = "SIGNUP";

      UserOTP.findOne(
        { mobile:user.mobile, otpType, validity: { $gte: Date.now() } },
        null,
        { sort: { createdAt: -1 } },
        async (err, userOTP) => {
          if (err || !userOTP) {
            logger.error(
              "AuthController.vaidateSignUpOTP() : Could not find entry..",
              err,
              userOTP
            );
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              error: true,
              respcode: Object.keys(STATUS_CODE.SIGNUP_MISSING_OTP)[0],
              message: STATUS_CODE.SIGNUP_MISSING_OTP,
            });
          }

          if (!userOTP.validateOTP(otp)) {
            logger.error(
              "AuthController.vaidateSignUpOTP() : Could not validate OTP",
              userOTP
            );
            return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
              error: true,
              respcode: Object.keys(STATUS_CODE.SIGNUP_OTP_INVALID)[0],
              message: STATUS_CODE.SIGNUP_OTP_INVALID,
            });
          }
          //If user is already existing, return the profile
          await User.findOne({mobile:user.mobile},'-password -hashed_password -salt', async(err, user1)=>{
            if (err) {
              return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
                error: true,
                respcode: Object.keys(STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS)[0],
                message: STATUS_CODE.SIGNUP_FAILURE_EMAIL_MOBILE_EXISTS,
              });
            }

            if (user1){
              //Create token and reply.
              const token = jwt.sign(
                {
                  uid: user1.userId,
                  email: user1.email,
                  mobile: user1.mobile,
                  name: user1.name,
                  type: user1.userType,
                  supplierId: user1.supplierId,
                  crmLeadId:user1.crmLeadId
                },
                process.env.JWT_SECRET,
                { expiresIn: null }
              );
              if(!user1.crmLeadId || user1.crmLeadId == null){
                user1.crmLeadId = crmLeadId;
                if(user1.isMobileValidated == true){
                  user1.save()
                }
              }
              if (user1.isMobileValidated == false)
              {
                user1.isMobileValidated = true;
                await user1.save(async (err, user2) => {
                  if (err) {
                     logger.info ("AuthController.signupWithMobile() : save MobileValidated ERROR: ", err);
                     return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
                      error: true,
                      respcode: Object.keys(STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS)[0],
                      message: STATUS_CODE.SIGNUP_FAILURE_EMAIL_MOBILE_EXISTS,
                    });
                  }
                });
              }
              return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
                error: false,
                respcode: Object.keys(STATUS_CODE.SIGNUP_SUCCESS)[0],
                message: STATUS_CODE.SIGNUP_SUCCESS,
                payload: {
                  token: token,
                  user:user1
                }
              });
            }

            logger.info ("AuthController.signupWithMobile() : user save :",  user);
            await user.save(async (err, user) => {
              if (err) {
                logger.info ("AuthController.signupWithMobile() : user save : ERROR:", err);
                return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
                  error: true,
                  respcode: Object.keys(STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS)[0],
                  message: STATUS_CODE.SIGNUP_FAILURE_EMAIL_MOBILE_EXISTS,
                });
              }

              const msgService = process.env.MS_COMMUNICATION_SERVICE_URL;
              const url = `${msgService}/newuser/whatsapp`;
              logger.info ("AuthController.signupWithMobile() : Sending whatsapp message on : ", url);

              //Send welcome message to user
              /*if(user.whatsapp){
                axios({method: "post", url: url,
                  headers: {
                    "content-type": "application/json",
                  },
                  data: {
                    payload: {
                      mobile: user.whatsapp,
                    },
                  },
                }).then(function (response) {
                  logger.info("AuthController.signupWithMobile() : response on whatsApp", response);
                })
                .catch(function (error) {
                  logger.error(
                    "AuthController.signupWithMobile() : Failed to send Whatsapp on mobile:",
                    user.whatsapp
                  );
                });
              }*/

              //Create token and reply.
              const token = jwt.sign(
                {
                  uid: user.userId,
                  email: user.email,
                  mobile: user.mobile,
                  name: user.name,
                  type: user.userType,
                  supplierId: user.supplierId
                },
                process.env.JWT_SECRET,
                { expiresIn: null }
              );

              return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
                error: false,
                respcode: Object.keys(STATUS_CODE.SIGNUP_SUCCESS)[0],
                message: STATUS_CODE.SIGNUP_SUCCESS,
                payload: {
                  token: token,
                  user,
                }
              });
            });
          });
        });
    } catch (err) {
      logger.error("ERROR : ", err.message);
      resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        respcode: Object.keys(STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS)[0],
        message: STATUS_CODE.SIGNUP_FAILURE,
      });
    }
  }
  /**
   * Ai to sigin with email or mobile
   * @param {*} req
   * @param {*} resp
   */
  async signin(req, resp) {
    try {
      const { email, password } = req.body;
      logger.info("AuthController.signin()", req.body);
  
      User.findOne({ email: email }, (err, user) => {
        if (err || !user) {
          logger.error("AuthController.signin() : ", err);
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            respcode: Object.keys(STATUS_CODE.SIGNIN_FAILURE)[0],
            message: STATUS_CODE.SIGNIN_FAILURE,
          });
        }
  
        // If user is found, make sure the email and password match
        // Create authenticate method in user model
        console.log(`Password provided: ${password}`);
        if (!user.authenticate(password)) {
          return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
            error: true,
            respcode: Object.keys(STATUS_CODE.SIGNIN_FAILURE)[0],
            message: STATUS_CODE.SIGNIN_FAILURE,
          });
        }
  
        // Generate a signed token with user id and secret
        const token = jwt.sign(
          {
            uid: user.userId,
            email: user.email,
            name: user.firstName + " " + user.lastName,
            type: user.userType,
          },
          process.env.JWT_SECRET,
          { expiresIn: "90d" }
        );
  
        // Persist the token as 't' in cookie with expiry date
        resp.cookie("t", token, {
          expire: new Date() + process.env.TOKEN_VALIDITY,
        });
  
        user.password = "";
        user.salt = "";
        user.hashed_password = "";
        
        // Return response with user and token to frontend client
        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: false,
          respcode: Object.keys(STATUS_CODE.SIGNIN_SUCCESS)[0],
          message: STATUS_CODE.SIGNIN_SUCCESS,
          payload: {
            token,
            user: user
          },
        });
      });
    } catch (err) {
      logger.error("AuthController.signin() err", err);
      resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        respcode: Object.keys(STATUS_CODE.SIGNIN_FAILURE)[0],
        message: STATUS_CODE.SIGNIN_FAILURE,
      });
    }
  }
  
  

  async changePassword(req, resp) {
    try {
      logger.info("updateProfile : ", req.body);
      logger.info("updateProfile headers: ", req.headers);
      const { userid } = req.headers;
      const { password, newPassword } = req.body;

      logger.info(
        "AuthController.changePassword() : saving new password for ",
        userid
      );

      User.findOne({ userId: userid }, (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            respcode: Object.keys(
              STATUS_CODE.CHANGE_PASSWORD_INCORRECT_EMAIL_PASSWORD
            )[0],
            message: STATUS_CODE.CHANGE_PASSWORD_INCORRECT_EMAIL_PASSWORD,
          });
        }

        // if user is found make sure the email and password match
        // create authenticate method in user model
        if (!user.authenticate(password)) {
          return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
            error: true,
            respcode: Object.keys(
              STATUS_CODE.CHANGE_PASSWORD_INCORRECT_EMAIL_PASSWORD
            )[0],
            message: STATUS_CODE.CHANGE_PASSWORD_INCORRECT_EMAIL_PASSWORD,
          });
        }

        // TODO_SP need to add await here.
        //user.encryptPassword(newPassword);

        user.password = newPassword;

        user.save((err, user) => {
          if (err) {
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              error: true,
              respcode: Object.keys(STATUS_CODE.CHANGE_PASSWORD_FAILURE)[0],
              message: STATUS_CODE.CHANGE_PASSWORD_FAILURE,
            });
          }
          resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            respcode: Object.keys(STATUS_CODE.CHANGE_PASSWORD_SUCCESS)[0],
            message: STATUS_CODE.CHANGE_PASSWORD_SUCCESS,
            payload: { email: user.email },
          });
        });
      });
    } catch (err) {
      console.error(err.message);
    }
  }

  async signinWithMobile(req, resp) {
    try {
      const { mobile, password } = req.body;
      logger.info("AuthController.signup()", req.body, mobile, password);

      User.findOne({ mobile }, (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            message: STATUS_CODE.SIGNIN_FAILURE,
          });
        }

        // if user is found make sure the email and password match
        // create authenticate method in user model
        if (!user.authenticate(password)) {
          return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
            message: STATUS_CODE.SIGNIN_FAILURE,
          });
        }
        // generate a signed token with user id and secret
        const token = jwt.sign(
          {
            uid: user.userId,
            email: user.email,
            mobile: user.mobile,
            name: user.name,
            type: user.userType,
            supplierId: user.supplierId
          },
          process.env.JWT_SECRET,
          { expiresIn: null }
        );
        // persist the token as 't' in cookie with expiry date
        resp.cookie("t", token, {
          expire: new Date() + process.env.TOKEN_VALIDITY,
        }); // 1 * 24 * 60 * 60 * 1000
        // return response with user and token to frontend client
        user.password = "";
        user.salt = "";
        user.hashed_password = "";
        return resp
          .status(STATUS_CODE.SERVER_SUCCESS)
          .json({
            token,
            user: user
          });
      });
    } catch (err) {
      console.error(err.message);
    }
  }

  async sendSignInOTP(req, resp) {
    try {
      const { mobile } = req.body;
      logger.info("AuthController.sendSignInOTP()", req.body, mobile);

      User.findOne({ mobile }, (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.SIGNIN_FAILURE_FOR_MOBILE,
          });
        }

        const otpservice = process.env.MS_COMMUNICATION_SERVICE_URL;

        //const url = `http://ms_communication:5000/api/communication/otp/signup`;
        const url = `${otpservice}/otp/signin`;
        // Fetch OTP from the communication

        let respData = undefined;

        (async function () {
          let response = await axios({
            method: "post",
            url: url,
            headers: {
              "content-type": "application/json",
            },
            data: {
              payload: {
                mobile: mobile,
              },
            },
          });

          logger.info("AuthController.sendSignInOTP()", response.data);

          respData = response.data;

          if (respData != undefined && respData.payload.error == false) {
            const otp = respData.payload ? respData.payload.otp : undefined;

            logger.info("AuthController.sendSignInOTP() saveOtP", otp);

            // Store the OTP for further usage
            const newUserOTP = new UserOTP({
              mobile: mobile,
              otp: otp,
              otpType: "SIGNIN",
              validity: Date.now() + 86400000,
            });

            newUserOTP.save().then((oUserOTP) => {
              logger.info("User OTP for Login Save", oUserOTP);

              return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
                error: false,
                message: STATUS_CODE.SIGNIN_OTP_SEND_SUCCESS,
              });
            });
          } else {
            logger.info("OTP not received");
            return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
              error: true,
              message: STATUS_CODE.SIGNIN_OTP_SEND_FAILED,
            });
          }
        })();
      });
    } catch (err) {
      logger.error(err.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        message: STATUS_CODE.SIGNIN_OTP_SEND_FAILED,
      });
    }
  }

  async signinWithOTP(req, resp) {
    try {
      const { mobile, otp } = req.body;
      logger.info("AuthController.signinWithOTP()", req.body, mobile, otp);
      const otpType = "SIGNIN";

      //"start_date" : { $gte : new ISODate("2015-05-27T00:00:00Z") }

      UserOTP.findOne(
        { mobile, otpType, validity: { $gte: Date() } },
        {},
        { sort: { createdAt: -1 } },
        (err, userOTP) => {
          logger.info("AuthController.signinWithOTP() : userOTP:", userOTP);
          if (err || !userOTP) {
            logger.info("AuthController.signinWithOTP() ERR: ", err);
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              error: true,
              respcode: Object.keys(STATUS_CODE.SIGNIN_WITH_OTP_FAILURE)[0],
              message: STATUS_CODE.SIGNIN_WITH_OTP_FAILURE,
            });
          }

          // if user is found make sure the email and password match
          // create authenticate method in user model
          logger.info("AuthController.signinWithOTP() : userOTP:", userOTP);
          if (!userOTP.validateOTP(otp)) {
            logger.info("AuthController.signinWithOTP() : failed to validate : ", otp);
            return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
              error: true,
              respcode: Object.keys(STATUS_CODE.SIGNIN_OTP_INVALID)[0],
              message: STATUS_CODE.SIGNIN_OTP_INVALID,
            });
          }

          User.findOne({ mobile }, async(err, user) => {
            if (err || !user) {
              return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
                error: true,
                respcode: Object.keys(STATUS_CODE.SIGNIN_WITH_OTP_FAILURE)[0],
                message: STATUS_CODE.SIGNIN_WITH_OTP_FAILURE,
              });
            }

            if (user.isMobileValidated == false){
              user.isMobileValidated = true;

              await user.save();
            }
            // generate a signed token with user id and secret
            const token = jwt.sign(
              {
                uid: user.userId,
                email: user.email,
                mobile: user.mobile,
                name: user.name,
                type: user.userType,
                supplierId: user.supplierId
              },
              process.env.JWT_SECRET,
              { expiresIn: null }
            );
            // persist the token as 't' in cookie with expiry date
            resp.cookie("t", token, {
              expire: new Date() + process.env.TOKEN_VALIDITY,
            });

            user.password="";
            user.salt="";
            user.hashed_password="";

            // return response with user and token to frontend client
            return resp
              .status(STATUS_CODE.SERVER_SUCCESS)
              .json({
                error: false,
                respcode: Object.keys(STATUS_CODE.SIGNIN_SUCCESS)[0],
                message: STATUS_CODE.SIGNIN_SUCCESS,
                payload: {
                  token,
                  user
                }
              });
          });
        }
      );
    } catch (err) {
      logger.error(err.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        respcode: Object.keys(STATUS_CODE.SIGNIN_WITH_OTP_FAILURE)[0],
        message: STATUS_CODE.SIGNIN_WITH_OTP_FAILURE,
      });
    }
  }

  async signout(req, resp) {
    try {
      resp.clearCookie("t");
      resp.json({ message: "Signout success" });
    } catch (err) {
      logger.error(err.message);
    }
  }

  async userInfo(req, resp) {
    try {
      logger.info("Req Params", req.query);
      const userId = req.headers['userid'];

      const iToken = req.get("authorization");

      // jwt.verify(iToken, process.env.JWT_SECRET, function (err, decoded) {
      //   console.log(
      //     "userInfo: decoded.email :",
      //     decoded.email,
      //     " request email:",
      //     userId
      //   );
      //   if (err || decoded.uid !== userId) {
      //     return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
      //       message: STATUS_CODE.SIGNIN_FAILURE,
      //     });
      //   }
      //   //console.log("Decode", decoded);
      // });

      User.findOne({ userId }, '-_id -password -salt -hashed_password', (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
            message: STATUS_CODE.SIGNIN_FAILURE,
          });
        }


        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          user: user
        });
      });
    } catch (err) {
      logger.error("userInfo" + err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        message: STATUS_CODE.SIGNIN_FAILURE,
      });
    }
  }

  async updateProfile(req, resp) {
    try {
      logger.info("updateProfile : ", req.body);
      logger.info("updateProfile headers: ", req.headers);
      const { userid } = req.headers;
      const { name, mobile, email, userType, company, roleInCompany, whatsapp, details,supplierId } = req.body;

      logger.info("updateProfile userId:", userid);

      User.findOne({ userId: userid }, '-password -salt -hashed_password', async (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.UPDATE_PROFILE_FAILURE,
          });
        }
        const newCrmLeadId = user.crmLeadId
        logger.info("Got User data as : ", user);
        user.name = name;
        user.email = email;
        user.mobile = mobile;
        user.crmLeadId = newCrmLeadId;
        if (userType) user.userType = userType;
        if (company) user.company = company;
        if (roleInCompany) user.roleInCompany = roleInCompany;
        if (whatsapp) user.whatsapp = whatsapp;
        if (details) user.details = details;
        if (supplierId) user.supplierId = supplierId;
        if (user.isFirstLogin == true && user.whatsapp){
          const msgService = process.env.MS_COMMUNICATION_SERVICE_URL;
          const url = `${msgService}/newuser/whatsapp`;

          //Send welcome message to user
          /*if(user.whatsapp){
            axios({method: "post", url: url,
              headers: {
                "content-type": "application/json",
              },
              data: {
                payload: {
                  mobile: user.whatsapp,
                },
              },
            }).then(function (response) {
              logger.info("AuthController.updateProfile() : response on whatsApp", response);
            })
            .catch(function (error) {
              logger.error(
                "AuthController.updateProfile() : Failed to send Whatsapp on mobile:",
                user.whatsapp
              );
            });
          }*/
        }

        if (company && supplierId){
          user.isFirstLogin = false ;
        }

        await user.save((err, user) => {
          if (err) {
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              message: STATUS_CODE.USERINFO_UPDATE_FAILURE,
            });
          }
          resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            payload: { user },
          });
        });
      });
    } catch (err) {
      logger.error("updateProfile" + err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        message: STATUS_CODE.USERINFO_UPDATE_FAILURE,
      });
    }
  }

  async updateSubscription(req, resp) {
    try {
      logger.info("updateSubscription : ", req.body);
      const { email, subscription, userId } = req.body;

      let query = {};
      if (userId) {
        query = { userId };
      }
      else {
        query = { email };
      }
      User.findOne(query, async (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            message: STATUS_CODE.SIGNIN_FAILURE,
          });
        }

        logger.info("Got User data as : ", user);
        user.isSupplierSubscribed = subscription;

        await user.save((err, user) => {
          if (err) {
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              message: STATUS_CODE.USERINFO_UPDATE_FAILURE,
            });
          }
          resp.status(STATUS_CODE.SERVER_SUCCESS).json({ email: user.email });
        });
      });
    } catch (err) {
      logger.error("updateSubscription" + err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        message: STATUS_CODE.USERINFO_UPDATE_FAILURE,
      });
    }
  }

  async updateBusinessRegistration(req, resp) {
    try {
      const { email, businessRegistration, supplierId, userId, company } = req.body;
      logger.info("updateBusinessRegistration : ", req.body);
      let query = {};
      if (userId) {
        query = { userId };
      }
      else {
        query = { email };
      }
      User.findOne(query, async (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            message: STATUS_CODE.SIGNIN_FAILURE,
          });
        }

        logger.info("Got User data as : ", user);
        user.isSupplierBusinessRegistered = businessRegistration;
        if (supplierId) {
          user.supplierId = supplierId;
        }
        if (company && (!user.company || user.company==null)){
          user.company = company;
        }

        await user.save((err, user) => {
          if (err) {
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              message: STATUS_CODE.USERINFO_UPDATE_FAILURE,
            });
          }

          resp.status(STATUS_CODE.SERVER_SUCCESS).json({ email: user.email });
        });
      });
    } catch (err) {
      logger.error("updateBusinessRegistration" + err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        message: STATUS_CODE.USERINFO_UPDATE_FAILURE,
      });
    }
  }

  async healthCheck(req, resp) {
    resp.status(STATUS_CODE.SERVER_SUCCESS).json({ message: "Health Ok" });
  }

  async isValidOrigin(req, resp, next) {
    const reqOrigin = req.headers.origin;
    logger.info("Request HEADER :", req.headers);
    logger.info("Req Origin:", reqOrigin, process.env.ACCEPTED_ORIGIN);

    if (reqOrigin !== process.env.ACCEPTED_ORIGIN) {
      //console.log (" Request origin is not accepted :", reqOrigin, process.env.ACCEPTED_ORIGIN);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        message: STATUS_CODE.BAD_REQUEST,
      });
    }

    next();
  }

  async verifyEmail(req, resp) {
    try {
      var { token } = req.body;
      logger.info("AuthController.verifyEmail() ", token);

      if (token == undefined) {
        return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
          error: true,
          message: STATUS_CODE.EMAIL_VERIFICATION_INPUT_FAILURE,
        });
      }

      jwt.verify(token, keys.secretOrKey, function (err, decoded) {
        console.log(
          "AuthController.verifyEmail() : verified token :",
          err,
          decoded
        );
        if (err != null) {
          console.log(
            "AuthController.verifyEmail() : Token verification Failed : ",
            err
          );
          return res.status(CONSTANT.SERVER_INTERNAL_ERROR_CODE).send({
            error: true,
            message: CONSTANT.EMAIL_VERIFICATION_FAILED,
          });
        }

        logger.info(
          "AuthController.verifyEmail() : decoded value of token : ",
          decoded
        );
        userId = decoded.userId;
        email = decoded.email;
        User.findOne({ email, userId }, (err, user) => {
          if (err || !user) {
            if (err) console.log("User.findOne() ERROR: ", err.message);
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              error: true,
              message: STATUS_CODE.INVALID_EMAIL,
            });
          }

          user.isEmailValidated = true;
          return res.status(CONSTANT.SERVER_SUCCESS).send({
            error: true,
            message: CONSTANT.EMAIL_VERIFICATION_SUCCESS,
          });
        });
      });
    } catch (err) {
      logger.error("ERROR: Token verification Failed : ", err);
      return res.status(CONSTANT.SERVER_INTERNAL_ERROR_CODE).send({
        error: true,
        message: CONSTANT.EMAIL_VERIFICATION_FAILED,
      });
    }
  }

  async resetPassword(req, resp) {
    try {
      const { email } = req.body.payload;
      logger.info("AuthController.resetPassword()", email);

      User.findOne({ email }, async (err, user) => {
        if (err || !user) {
          if (err)
            logger.error(
              "AuthController.resetPassword(): User.findOne() ERROR: ",
              err.message
            );
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.INVALID_EMAIL,
          });
        }

        const resetPwd = generatePwd();
        user.password = resetPwd;

        await user.save(async (err, user) => {
          if (err) {
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              message: STATUS_CODE.RESET_PASSWORD_FAILED,
            });
          }

          let ret = await sendResetPasswordMail(
            resetPwd,
            user.email,
            user.name
          );
          logger.info(
            "AuthController.resetPassword() : Response from Mailer:",
            ret
          );

          if (ret) {
            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              message: STATUS_CODE.RESET_PASSWORD_SUCCESS,
            });
          }
        });
      });
    } catch (err) {
      logger.error("ERROR : AuthController.resetPassword() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.RESET_PASSWORD_FAILED,
      });
    }
  }

  /**
   * Api to add/update profile image
   * @param {*} req
   * @param {*} resp
   * @returns
   */
  async updateProfileImage(req, resp){
    logger.info("AuthController.updateProfileImage()", req.files);

    try {
      const userId = req.headers['userid'];
      let fileData = req.files;

      logger.info(
        "AuthController.updateProfileImage() userId:",
        userId
      );
      logger.info("AuthController.updateProfileImage() logofile:", fileData);

      if (!req.files || Object.keys(req.files).length === 0) {
        return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
          error: true,
          message: STATUS_CODE.USER_UPDATE_IMAGE_NO_FILE_UPLOADED,
        });
      }

      User.findOne({ userId },'-password -salt -hashed_password', async (err, user) => {
          if (err || !user) {
            return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
              error: true,
              message: STATUS_CODE.USER_UPDATE_IMAGE_FAILED,
            });
          }

          logger.info("AuthController.updateProfileImage() user=", user);

          let file =
            user.name.replace(/\s+/g, '_') + `${userId}` + `${fileData.profileImage.name}`;
          logger.info("AuthController.updateProfileImage(): New File Name: ", file);
          let ret = await FileService.uploadFileToCloud(
            fileData.profileImage,
            file
          );
          if (ret == null || ret.error == true) {
            logger.info("AuthController.updateProfileImage(): Failed to upload File: ");
            return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
              error: true,
              message: STATUS_CODE.USER_UPDATE_IMAGE_FAILED,
            });
          } else {
            logger.info("AuthController.updateProfileImage(): URL value from FileService: ", ret.payload);
            //https://smpimage.blob.core.windows.net/business/Perfect_Service_SolutionsMicrosoftTeams-image%20(3).png
            user.imgUrl =
              "/assets/" + process.env.STORAGE_MEDIA_PATH + "/" + file;
          }

          user.save((err1, user) => {
            if (err1) {
               logger.error ( "AuthController.updateProfileImage(): ERROR:", err1);
              return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
                error: true,
                message: STATUS_CODE.USER_UPDATE_IMAGE_FAILED,
                });
            }

            logger.info(
              "AuthController.updateProfileImage(): saved user",
              user
            );

            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              message: STATUS_CODE.USER_UPDATE_IMAGE_SUCCESS,
              payload: user
            });
          });
        }
      );
    } catch (err2) {
      logger.error(err2);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        message: STATUS_CODE.USER_UPDATE_IMAGE_SUCCESS,
      });
    }
  }

  async addUser (req, resp){
    const user = await new User(req.body);
    user.isMobileValidated = false ;

    try {
      await User.findOne({mobile:user.mobile},'-_id -password -hashed_password -salt', async(err, user1)=>{
        if (err) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            respcode: Object.keys(STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS)[0],
            message: STATUS_CODE.SIGNUP_FAILURE_EMAIL_MOBILE_EXISTS,
          });
        }
        if (user1){
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            respcode: Object.keys(STATUS_CODE.SIGNUP_SUCCESS)[0],
            message: STATUS_CODE.SIGNUP_SUCCESS,
            payload: user1
          });
        }

        await user.save(async (err, user) => {
          if (err) {
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              error: true,
              respcode: Object.keys(STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS)[0],
              message: STATUS_CODE.SIGNUP_FAILURE_EMAIL_MOBILE_EXISTS,
            });
          }

          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            respcode: Object.keys(STATUS_CODE.SIGNUP_SUCCESS)[0],
            message: STATUS_CODE.SIGNUP_SUCCESS,
            payload: user
          });
        });
      });
    }
    catch(err){
      logger.error("ERROR : ", err.message);
      resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        respcode: Object.keys(STATUS_CODE.VALIDATE_SIGNUP_OTP_SUCCESS)[0],
        message: STATUS_CODE.SIGNUP_FAILURE,
      });
    }
  }
  /*async sendEmailVerificationMail(userId, email){
    try{
      console.log ("sendEmailVerificationMail", userId, email);
      const emailEervice = process.env.MS_COMMUNICATION_SERVICE_URL;
      const url = `${emailEervice}/email/verify`;

      const verifyToken = jwt.sign(
        { _id: userId, email: email },
        process.env.JWT_SECRET,
        { expiresIn: "5d" }
      );

      (async function () {
        let response = await axios({
          method: "post",
          url: url,
          headers: {
            "content-type": "application/json",
          },
          data: {
            payload: {
              token: verifyToken,
            },
          },
        });
      });
      return true;
    }
    catch(err){
      console.log ("ERROR : Failed to send Verification email");
      return false ;
    }
  }*/


  async getUserDataById(req, resp) {
    try {
      const { userId } = req.body;
      logger.info("AuthController.sendSignInOTP()", req.body, userId);

      User.findOne({ userId }, (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: false,
          });
        }else{
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: true,
            payload:user
          }); 
        }
      })

    } catch (err) {
      logger.error(err.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        message: STATUS_CODE.USER_CHECK_FAILED,
      });
    }
  }

  async  updateCrmId(req, resp) {
    try {
      const { userId, crmLeadId } = req.body;
      logger.info("AuthController.update crm id()", req.body, userId);
  
      User.findOne({ userId }, (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: "user not found with this user id",
          });
        } else {
          if (user.crmLeadId && user.crmLeadId === crmLeadId) {
            // If crmLeadId is already present and matches the value from req.body, no need to update
            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              message: "crm lead id updated successfully..!",
              // payload: user,
            });
          } else {
            // Update the crmLeadId with the value from req.body
            user.crmLeadId = crmLeadId;
            user.save((err, updatedUser) => {
              if (err) {
                return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
                  error: true,
                  message: STATUS_CODE.FAILED_TO_ADD_CRM_ID,
                });
              } else {
                return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
                  error: false,
                  message: "crm lead id added successfully...!",
                  // payload: updatedUser,
                });
              }
            });
          }
        }
      });
    } catch (err) {
      logger.error(err.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        message: STATUS_CODE.FAILED_TO_ADD_CRM_ID,
      });
    }
  }
  
  
  
}

module.exports = new AuthController();

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: "auth",
  algorithms: ["HS256"],
});

exports.isAuth = (req, resp, next) => {
  let user = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!user) {
    return resp.status(403).json({
      error: "Access denied",
    });
  }
  next();
};

exports.isAdmin = (req, resp, next) => {
  if (req.profile.role === 0) {
    return resp.status(403).json({
      error: "Admin resourse! Access denied",
    });
  }
  next();
};

/**
 * google login full
 * https://www.udemy.com/instructor/communication/qa/7520556/detail/
 */
