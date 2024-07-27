const express = require("express");
const router = express.Router();

const {
    signup,
    signin,
    signout,
    requireSignin
} = require("../controllers/auth");

const authController = require("../controllers/auth");
const favouriteController = require("../controllers/favourite");
const demoController = require("../controllers/demo");
const mgmtController = require("../controllers/mgmt");

const { userValidationRules, authValidate, validateAdminOrSuperAdmin } = require('../validators/authValidator.js');
const { userValidateRules, userValidate } = require('../validators/userValidator.js');

router.post("/signup", authController.signup);
router.post("/signup/otp", authController.sendSignUpOTP);
router.post("/signup/validate-otp", authController.vaidateSignUpOTP);
router.post("/signup/mobile", authController.signupWithMobile);
router.post("/signin", authController.signin);
router.post("/signinwithmobile", authController.signinWithMobile);
router.post("/signin/send-otp", authController.sendSignInOTP);
router.post("/user-data", authController.getUserDataById);
router.post("/signin/validate-otp", authController.signinWithOTP);
router.post("/signout", /*authController.isValidOrigin,*/ authController.signout);
router.get("/info", /*authController.isValidOrigin,*/ authController.userInfo);
router.post("/profile", authController.updateProfile);
router.post("/change-password", authController.changePassword);
router.post("/email-verify", authController.verifyEmail);
router.post("/reset-password", authController.resetPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/profile/image", authController.updateProfileImage);
router.post("/adduser", authController.addUser);
router.post("/update-crm-id", authController.updateCrmId);

router.post("/mgmt/login", mgmtController.login);
router.post("/mgmt/change-password", mgmtController.changePassword);
router.post("/mgmt/user/change-password", validateAdminOrSuperAdmin, mgmtController.updateUserPassword);
router.post("/mgmt/reset-password", validateAdminOrSuperAdmin, mgmtController.resetPassword);
router.post("/mgmt/adduser", validateAdminOrSuperAdmin, mgmtController.addmgmtUser);
router.get("/mgmt/user-profile", validateAdminOrSuperAdmin, mgmtController.userInfo);
router.post("/mgmt/user", userValidateRules(), userValidate, validateAdminOrSuperAdmin, mgmtController.updateUser);
router.get("/mgmt/users", validateAdminOrSuperAdmin, mgmtController.getTotalUsers);
router.post("/mgmt/registeruser", userValidationRules(), authValidate, validateAdminOrSuperAdmin, mgmtController.registerUser);
router.get("/mgmt/agents", validateAdminOrSuperAdmin, mgmtController.getTotalAgents);
router.post("/mgmt/removeuser/:userId", validateAdminOrSuperAdmin, mgmtController.removeAgents);
router.post("/mgmt/updateuser", validateAdminOrSuperAdmin, mgmtController.updatemgmtUser);

router.post("/update/subscription", authController.updateSubscription);
router.post("/update/businessregistration", authController.updateBusinessRegistration);
router.get("/hc", authController.healthCheck);
//router.post("/signup", userSignupValidator, authController.signup);
//router.post("/signin", signin);
//router.get("/signout", signout);

router.post("/favourite/additem", favouriteController.addItem);
router.post("/favourite/removeitem", favouriteController.removeItem);
router.get("/favourite/myitems", favouriteController.getMyFavourite);

router.post("/demo/request", demoController.requestDemo);

module.exports = router;
