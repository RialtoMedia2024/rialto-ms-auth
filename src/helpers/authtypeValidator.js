const logger = require("../logger/logger.js");

class authAuthenticator {

  constructor(info) {
    const { request, userType } = info;
    // logger.info(`authAuthenticator.constructor() :: info: `, info);

    this.request = request;
    this.userType = userType;
  }

  validateUsertype(){
    let isValid = true;
    const { userid, type } = this.request.headers;
    logger.info( `authAuthenticator.validateUsertype() :: userid: `, userid, ` type: `, type);
  
    if (
      userid == undefined ||
      userid == "" ||
      type.toUpperCase() != this.userType.toUpperCase()
    ) {
  
      isValid = false;
      logger.info( `authAuthenticator.validateUsertype() :: Invalid user: `);
  
    }
    logger.info( `authAuthenticator.validateUsertype() :: isValid: `, isValid);
    return isValid;
  }
  
}


module.exports = authAuthenticator;
