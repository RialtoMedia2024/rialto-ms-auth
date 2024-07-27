const MgmtUser = require("../models/mgmtuser");
const jwt = require("jsonwebtoken"); // to generate signed token
const expressJwt = require("express-jwt"); // for authorization check
const axios = require("axios");
const { errorHandler } = require("../helpers/dbErrorHandler");
const STATUS_CODE = require("../configs/errors");
const CONSTANTS = require("../configs/constants");
const { generatePwd } = require("../helpers/randomPwdGenerator");
const { sendResetPasswordMail } = require("../helpers/resetPasswordMailer");

const logger = require("../logger/logger.js");
const User = require("../models/user");
const { sendEmailVerificationMail } = require("../helpers/verificationMailer");

class MgmtController {

  async login (req, resp){
    try{
      const { email, password } = req.body.payload;
      console.log("MgmtController.login()", req.body, email);

      MgmtUser.findOne({email: email, isDeleted: false}, (err, user) => {
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
        logger.info ("Mgmt User Details: ", user);
        // generate a signed token with user id and secret
        const tokenData = {
            uid: user.userId,
            email: user.email,
            mobile: user.mobile,
            name: user.name,
            type: user.userType,
            supplierId:user.supplierId
          };

        logger.info ("MgmtController.login() :  token Data: ", tokenData);
        const token = jwt.sign(
          tokenData,  process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        // return response with user and token to frontend client
        const { userId, name, email, mobile, userType } = user;
        return resp
          .status(STATUS_CODE.SERVER_SUCCESS)
          .json({ token, user: { userId, email, mobile, name, userType } });
      });
    }
    catch(err){
      console.log ("ERROR : MgmtController.login() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        message: STATUS_CODE.SIGNIN_FAILURE,
      });
    }
  }

  /* UPDATE USER (ONLY FOR ADMIN) */
  async updateUser (req, resp){
    try{
      const { userid, type } = req.headers;
      logger.info("MgmtController.updateUser() :: Loggedin User Details: ", userid, type);

      logger.info("MgmtController.updateUser() :: User.findOne() : response: ", true);
      const usersId = req.body.userId;
      const { name, email, mobile, userType, company, roleInCompany, password,whatsapp } = req.body;
      const userPayload = {
        name: name,
        email: email,
        userType: userType,
        company: company,
        roleInCompany: roleInCompany,
        whatsapp:whatsapp
      };

      // .updateOne({ })
      User
      .findOneAndUpdate(
        {userId: usersId}, {$set: userPayload }, {new: true}
      )
      .then((response) => {
        if (response) {
          logger.info(
            `MgmtController.updateUser() Success : `,
            response
          );
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.USER_UPDATED_SUCCESS,
            data: {
              userId: response.userId,
              name: response.name,
              email: response.email,
              mobile: response.mobile,
              whatsapp:response.whatsapp,
              userType: response.userType,
              company: response.company,
              roleInCompany: response.roleInCompany,
              role: response.role,
              history: response.history,
              createdAt: response.createdAt,
              updatedAt: response.updatedAt,
            },
          });
        } else {
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.DATA_NOT_FOUND,
            data: null,
          });
        }
      })
      .catch((err) => {
        logger.info(
          `MgmtController.updateUser() Inner Catch Error : `,
          err
        );
        resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
          error: true,
          message: STATUS_CODE.SERVER_FAILURE,
          errorCode: "SERVER_FAILURE",
        });
      });

    }
    catch(err){
      logger.error("ERROR : MgmtController.updateUser() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.USER_UPDATED_FAILURE,
        errorCode: "SERVER_BAD_REQUEST",
      });
    }
  }

  /* GET TOTAL USERS (ONLY FOR ADMIN) */
  async getTotalUsers (req, resp){
    try{
      const { userId, name, email, mobile } = req.query;
      logger.info("MgmtController.getTotalUsers() :: req.query: ", req.query);

      const { userid, type } = req.headers;
      logger.info("MgmtController.getTotalUsers() :: Loggedin User Details: ", userid, type);

      // Either Email, Mobile, Name, userId or getAllData Filter
        let query = {$and: []};
        let msg = "Filtering Data according to : ";
        if ( !userId && !name && !email && !mobile ) { query = {}; msg = "Finding All Data"; }
        if (userId && userId !="") {
          msg += "userId, ";
          const userCond = { userId: userId };
          query.$and.push(userCond);
        }
        if (name && name !="") {
          msg += "name, ";
          const nameCond = { "name": {"$regex" : name, "$options" : "si"} };
          query.$and.push(nameCond);
        }
        if (email && email !="") {
          msg += "email, ";
          const emailCond = { "email": {"$regex" : email, "$options" : "si"} };
          query.$and.push(emailCond);
        }
        if (mobile && mobile !="") {
          msg += "mobile, ";
          const mobileCond = { "mobile": {"$regex" : `^${mobile}`, "$options" : "si"} };
          query.$and.push(mobileCond);
        }
        console.log(`MgmtController.getTotalUsers() :: QUERY: ` , query, `MESSAGE: ` , msg);

      // Either Email, Mobile, Name, userId or getAllData Filter

      const selector = {
        _id: 1,
        userId: 1,
        name: 1,
        email: 1,
        mobile: 1,
        whatsapp: 1,
        userType: 1,
        company: 1,
        roleInCompany: 1,
        isEmailValidated: 1,
        isMobileValidated: 1,
        isSupplierSubscribed: 1,
        isSupplierBusinessRegistered: 1,
        supplierId: 1,
        about: 1,
        role: 1,
        history: 1,
        createdAt: 1,
        updatedAt: 1,
      };
      User
      .find(query)
      .select(selector)
      // .aggregate(query)
      // .countDocuments()
      .then((response) => {
        if (response) {
          logger.info(
            `MgmtController.getTotalUsers() Success : `,
            response
          );
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.ALL_USERS_FETCHED_SUCCESS,
            data: {
              users: response,
            },
          });
        } else {
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.DATA_NOT_FOUND,
            data: null,
          });
        }
      })
      .catch((err) => {
        logger.info(
          `MgmtController.getTotalUsers() Inner Catch Error : `,
          err
        );
        resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
          error: true,
          message: STATUS_CODE.SERVER_FAILURE,
          errorCode: "SERVER_FAILURE",
        });
      });

    }
    catch(err){
      logger.error("ERROR : MgmtController.getTotalUsers() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.ALL_USERS_FETCHED_FAILURE,
        errorCode: "SERVER_BAD_REQUEST",
      });
    }
  }

  /* REGISTER USER (ONLY FOR ADMIN) */
  async registerUser (req, resp){
    try{
      const { userid, type } = req.headers;
      logger.info("MgmtController.registerUser() :: Loggedin User Details: ", userid, type);

      const { name, email, mobile, whatsapp, userType, company, roleInCompany, password } = req.body;
      const newUserPayload = {
        name: name,
        email: email,
        mobile: mobile,
        whatsapp: whatsapp,
        userType: userType ? userType.toUpperCase() : userType,
        company: company,
        roleInCompany: roleInCompany,
        password: password
      };
      logger.info("MgmtController.registerUser() :: newUserPayload: ", newUserPayload);

      const user = await new User(newUserPayload);
      logger.info("MgmtController.registerUser() :: user: ", user);

      await user.save(async (err, user) => {
        if (err || !user) {
          logger.info("MgmtController.registerUser() :: User.save() : err: ", err);
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.SIGNUP_FAILURE_EMAIL_MOBILE_EXISTS,
            errorCode: "SERVER_BAD_REQUEST",
          });
        }

        logger.info("MgmtController.registerUser() :: User.save() : user: ", user);

        user.salt = undefined;
        user.hashed_password = undefined;

        //Send Email verification Email
        const msgService = process.env.MS_COMMUNICATION_SERVICE_URL;
        const url = `${msgService}/newuser/whatsapp`;
        logger.info ("AuthController.signupWithMobile() : Sending whatsapp message on : ", url);

        //Send welcome message to user
        /*if (user.whatsapp){
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

        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: false,
          respcode: STATUS_CODE.SERVER_SUCCESS,
          message: STATUS_CODE.USER_REGISTER_SUCCESS,
          payload: {
            userId: user.userId,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            userType: user.userType,
            company: user.company,
            roleInCompany: user.roleInCompany,
          },
        });

      });

    }
    catch(err){
      logger.error("ERROR : MgmtController.registerUser() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.SIGNIN_FAILURE,
        errorCode: "SERVER_BAD_REQUEST",
      });
    }
  }

  /* CHANGE PASSWORD FOR USER */
  async updateUserPassword( req, resp) {
    const { userid, type } = req.headers;
    logger.info("MgmtController.updateUserPassword() : headers :  ", req.headers);
    try {
      logger.info("MgmtController.updateUserPassword() : ", req.body);

      const { userId, email, password } = req.body;

      logger.info(
        "AuthController.changePassword() : saving new password for ",
        userId
      );

      User.findOne({ userId }, (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            respcode: Object.keys(
              STATUS_CODE.CHANGE_PASSWORD_INCORRECT_EMAIL_PASSWORD
            )[0],
            message: STATUS_CODE.CHANGE_PASSWORD_INCORRECT_EMAIL_PASSWORD,
          });
        }

        user.password = password;
        user.email = email;

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
      console.error("AuthController.changePassword() : ERROR: " , err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        respcode: Object.keys(STATUS_CODE.CHANGE_PASSWORD_FAILURE)[0],
        message: STATUS_CODE.CHANGE_PASSWORD_FAILURE,
      });
    }
  }

  async resetPassword(req, resp){
    try{
      const { email } = req.body.payload;
      console.log("MgmtController.resetPassword()", email);

      MgmtUser.findOne({ email }, async (err, user) => {
        if (err || !user) {
          if (err) console.log("MgmtController.resetPassword(): MgmtUser.findOne() ERROR: ", err.message);
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.INVALID_EMAIL
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

          let ret = await sendResetPasswordMail(resetPwd, user.email, user.name);
          console.log ("MgmtController.resetPassword() : Response from Mailer:",  ret);

          if (ret ){
            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              message: STATUS_CODE.RESET_PASSWORD_SUCCESS
            });
          }
        });
      });
    }
    catch (err){
      console.log("ERROR : MgmtController.resetPassword() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.RESET_PASSWORD_FAILED
      });
    }
  }


  async changePassword(req, resp) {
    try {
      console.log ("MgmtController.changePassword : headers: ", req.headers);
      let {userid, type} = req.headers;

      const {password, newPassword} = req.body;

      console.log("MgmtController.changePassword() for ", userid);
      let query = {userId: userid, isDeleted: false}
      if (type.toUpperCase() == "SUPER_ADMIN") {
        userid = req.query.userid;
        if(userid){
          query = {
            userId: userid,
            isDeleted: false,
            userType: {
              $not: {
                $regex: /SUPER_ADMIN/,
                $options: 'i'
              }
            }
          }
        }
        else {
          userid = req.headers.userid;
        }
       
      }
      console.log("MgmtController.changePassword() for ", userid, JSON.stringify(query));

      MgmtUser.findOne(query, (err, user) => {
        if (err || !user) {
          console.log ("MgmtController.changePassword() : No user found with userId : ", userid);
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            message: STATUS_CODE.INVALID_EMAIL,
          });
        }

        // if user is found make sure the email and password match
        // create authenticate method in user model
        if (!user.authenticate(password)) {
          console.log ("MgmtController.changePassword() : Failed to authenticate Password");
          return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
            message: STATUS_CODE.CHANGE_PASSWORD_FAILURE,
          });
        }

        user.password = newPassword ;

        user.save((err, user) => {
          if (err) {
              return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              message: STATUS_CODE.CHANGE_PASSWORD_FAILURE,
            });
          }
          resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            payload: { email: user.email }
          });
        });
      });
    } catch (err) {
      console.log ("ERROR : MgmtController.changePassword() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        message: STATUS_CODE.CHANGE_PASSWORD_FAILURE,
      });
    }
  }

  async addmgmtUser (req, resp) {
    try {
      console.log ("MgmtController.addmgmtUser() : ", req.body );
      const { password, name, mobile, userType, email } = req.body.payload;
      console.log("MgmtController.addmgmtUser() : email", email);

      const updatedUser = await MgmtUser.findOne({ email: email, isDeleted: true });
      console.log("ReactivatedUser", updatedUser)

      if (updatedUser) {
        updatedUser.name = name;
        updatedUser.email = email;
        updatedUser.mobile = mobile;
        updatedUser.userType = userType;
        updatedUser.isDeleted = false;
        updatedUser.password = password;

        const reactivatedUser = await updatedUser.save();
        if (!reactivatedUser) {
          logger.error("ERROR: MgmtController.updatemgmtUser():", err.message);
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.REACTIVATED_USER_FAILED,
            errorCode: "SERVER_BAD_REQUEST",
          });
        }
        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: false,
          message: STATUS_CODE.REACTIVATED_USER_SUCCESS,
          payload: { mgmtUser: updatedUser },
        });
      }
        
      const user = await new MgmtUser(req.body.payload);
      console.log("MgmtController.addmgmtUser()", user);

      await user.save(async (err, user) => {
        if (err) {
            console.log("MgmtController.addmgmtUser() : Failed to add User : ", err);
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            message: STATUS_CODE.SIGNUP_FAILURE,
          });
        }

        user.salt = undefined;
        user.hashed_password = undefined;

        resp.status(STATUS_CODE.SERVER_SUCCESS).json({ email: user.email });
      });
    } catch (err) {
      console.log("ERROR : MgmtController.addmgmtUser(): ", err.message);
      resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        message: STATUS_CODE.SIGNUP_FAILURE,
      });
    }
  }

  async userInfo (req, resp) {
    try {
      const { userid, type } = req.headers;
      const userInfoId = req.query.userId ;
      logger.info("MgmtController.userInfo() :: Admin Details: ", userid, type);

      logger.info("MgmtController.userInfo() :userId", userInfoId);

      MgmtUser.findOne({ userId: userInfoId }, (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_UNAUTHORIZED).json({
            message: STATUS_CODE.SIGNIN_FAILURE,
          });
        }

        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          user: {
            userId : user.userId,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            userType: user.userType,
            supplierId: user.supplierId,
            company: user.company,
            roleInCompany: user.roleInCompany,
            isEmailValidated: user.isEmailValidated,
            isMobileValidated: user.isMobileValidated,
            isSupplierSubscribed: user.isSupplierSubscribed,
            isSupplierBusinessRegistered: user.isSupplierBusinessRegistered,
          },
        });
      });

    }
    catch(err){
      logger.error("MgmtController.userInfo() : " + err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        message: STATUS_CODE.DATA_NOT_FOUND,
      });
    }
  }

  async logout (req, resp) {
    try {
      resp.redirect('');
      resp.json({ message: "Signout success" });
    } catch (err) {
      console.error(err.message);
    }
  }

  /* GET TOTAL AGENTS EXCEPT SUPER-ADMIN (ONLY FOR SUPER-ADMIN) */
  async getTotalAgents (req, resp){
    try{
      logger.info("MgmtController.getTotalAgents() :: req.query: ", req.query);
      
     // const query = { isDeleted: false };
       const query = {};
     // const query = { userType: {$nin: [/SUPER_ADMIN/i]} };
      console.log(`MgmtController.getTotalAgents() :: QUERY: ` , query);
      
      MgmtUser
      .find(query)
      // .select(selector)
      .then((response) => {
        if (response && response.length>0) {
          logger.info( `MgmtController.getTotalAgents() Success : `, response );
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.ALL_AGENTS_FETCHED_SUCCESS,
            data: {
              agents: response,
              total: response.length
            },
          });
        } else {
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.DATA_NOT_FOUND,
            data: null,
          });
        }
      })
      .catch((err) => {
        logger.info( `MgmtController.getTotalAgents() Inner Catch Error : `, err );
        return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
          error: true,
          message: STATUS_CODE.SERVER_FAILURE,
          errorCode: "SERVER_FAILURE",
        });
      });

    }catch(err){
      logger.error("ERROR : MgmtController.getTotalAgents() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.ALL_AGENTS_FETCHED_FAILURE,
        errorCode: "SERVER_BAD_REQUEST",
      });
    }
  }

  /* REMOVE AGENTS (ONLY FOR SUPER-ADMIN) */
  async removeAgents (req, resp){
    try{
      logger.info("MgmtController.removeAgents() :: req.params: ", req.params);
      const { userId } = req.params;

      // const query = { isDeleted: false, userType: {$nin: ["SUPER_ADMIN"]} };
      // console.log(`MgmtController.removeAgents() :: QUERY: ` , query);
      
      MgmtUser
      .findOneAndDelete({userId: userId})
      .then((response) => {
        if (response) {
          logger.info( `MgmtController.removeAgents() Success : `, response );
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.AGENTS_DELETE_SUCCESS,
            data: response,
          });
        } else {
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.DATA_NOT_FOUND,
            data: null,
          });
        }
      })
      .catch((err) => {
        logger.info( `MgmtController.removeAgents() Inner Catch Error : `, err );
        return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
          error: true,
          message: STATUS_CODE.SERVER_FAILURE,
          errorCode: "SERVER_FAILURE",
        });
      });

    }catch(err){
      logger.error("ERROR : MgmtController.removeAgents() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.AGENTS_DELETE_FAILURE,
        errorCode: "SERVER_BAD_REQUEST",
      });
    }
  }

  async updatemgmtUser(req, resp) {

    try {
      logger.info("MgmtController.updatemgmtUser() : ", req.body);
  
      const { userId, name, email, mobile, userType, isDeleted } = req.body;
      logger.info(
        "AuthController.updatemgmtUser() : updatemgmtUser for ",
        userId
      );
  
      MgmtUser.findOne({ userId }, (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.DATA_NOT_FOUND,
            data: null,
          });
        }
  
        user.name = name;
        user.email = email;
        user.mobile = mobile;
        user.userType = userType;

        if (isDeleted && isDeleted != "") {
          user.isDeleted = isDeleted;
        }
        
        user.save((err, user) => {
          if (err) {
            logger.error("ERROR : MgmtController.updatemgmtUser() : ", err.message);
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              error: true,
              message: STATUS_CODE.USER_UPDATED_FAILURE,
              errorCode: "SERVER_BAD_REQUEST",
            });
          }
          resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.USER_UPDATED_SUCCESS,
            payload: { mgmtUser: user },
          });
        });
      });
    } catch (err) {
      logger.error("ERROR : MgmtController.updatemgmtUser() : ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.USER_UPDATED_FAILURE,
        errorCode: "SERVER_BAD_REQUEST",
      });
    }
  }

}

module.exports = new MgmtController();
