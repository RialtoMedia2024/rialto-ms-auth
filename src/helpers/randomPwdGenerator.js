const {PASSWORD_LENGTH} = require ("../configs/constants")

function generatePwd() {
  var alphabets = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  var pwd = "";
  var pwdLength = PASSWORD_LENGTH;

  var alphabetsLen = alphabets.length - 1;
  for (var i = 0; i < pwdLength; i++) {
    var randNum = Math.floor(Math.random() * alphabetsLen) + 1;
    pwd += alphabets[randNum];
  }
  return pwd;
}


module.exports.generatePwd = generatePwd;
