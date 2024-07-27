const { body, validationResult } = require('express-validator');
const STATUS_CODE = require("../configs/errors");

const userValidateRules = () => {
  console.log("Body", body);
  return [
    // username must be an email
    body('userId', STATUS_CODE.USERID_EMPTY)
    .notEmpty(),
    body('name', STATUS_CODE.NAME_EMPTY)
    .notEmpty(),
    // body('email', STATUS_CODE.EMAIL_EMPTY)
    // .notEmpty().isEmail(),
    body('mobile', STATUS_CODE.MOBILE_EMPTY)
    .notEmpty(),
    body('userType', STATUS_CODE.USERTYPE_EMPTY)
    .notEmpty(),
    // body('company', STATUS_CODE.COMPANY_EMPTY)
    // .notEmpty(),
    // body('roleInCompany', STATUS_CODE.ROLE_EMPTY)
    // .notEmpty(),
    // body('password', STATUS_CODE.PASSWORD_EMPTY)
    // .notEmpty()
    // .isLength({ min: 5 , max :15 }),

  ]
}

const userValidate = (req, res, next) => {
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

module.exports = {
  userValidateRules,
  userValidate,
}
