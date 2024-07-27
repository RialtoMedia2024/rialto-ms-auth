const { body, validationResult } = require('express-validator');
const STATUS_CODE = require("../configs/errors");
const logger = require("../logger/logger.js");

const userValidationRules = () => {
  console.log("Body", body);
  return [
    // username must be an email
    body('name').notEmpty(),
    //body('email').isEmail(),
    body('mobile').notEmpty(),
    // password must be at least 5 chars long
    //body('password').notEmpty(),
    body('password').isLength({ min: 5 , max :15 }),
  ]
}

const authValidate = (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }
  const extractedErrors = []
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))

  console.log("Errors", extractedErrors);

  return res.status(422).json({
    errors: extractedErrors,
  })
}

const validateAdminOrSuperAdmin = (req, res, next) => {
  let isValid = true;
  const { userid, type } = req.headers;
  logger.info( `validateAdminOrSuperAdmin() :: userid: `, userid, ` type: `, type);
  if (
    userid == undefined ||
    userid == "" ||
    (type.toUpperCase() != "ADMIN" && type.toUpperCase() != "SUPER_ADMIN")
  ) {
    isValid = false;
    logger.info( `validateAdminOrSuperAdmin() :: Invalid user: `);
  }

  logger.info( `validateAdminOrSuperAdmin() :: isValid: `, isValid);
  if(!isValid){
    return res.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
      error: true,
      message: STATUS_CODE.UNAUTHORIZED_ACCESS,
      errorCode: "UNAUTHORIZED_ACCESS",
    });
  }
  return next();
}

module.exports = {
  userValidationRules,
  authValidate,
  validateAdminOrSuperAdmin,
}


/*
req.check('name', 'Name is required').notEmpty();
req.check('email', 'Email must be between 3 to 32 characters')
    .matches(/.+\@.+\..+/)
    .withMessage('Email must contain @')
    .isLength({
        min: 4,
        max: 32
    });
req.check('password', 'Password is required').notEmpty();
req.check('password')
    .isLength({ min: 6 })
    .withMessage('Password must contain at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number');
const errors = req.validationErrors();
if (errors) {
    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).json({ error: firstError });
}*/
