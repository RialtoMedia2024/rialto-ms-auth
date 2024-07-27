// const mongoose = require("mongoose");

// const userOTPSchema = new mongoose.Schema(
//   {
//     mobile: {
//       type: String,
//       trim: true,
//       required: true,
//     //  unique: true,
//     },
//     email: {
//         type: String,
//         trim: true,
//         required: false,
//     },
//     otp: {
//       type: String,
//       trim: true,
//     },
//     otpType: {
//       type: String,   // SIGNIN , SIGNUP
//       trim: true,
//     },
//     validity: {
//       type: Date,
//       default: Date.now() + 1800000, //30 mins *60 sec *1000 msec;
//     }
//   },
//   { timestamps: true }
// );

// userOTPSchema.methods = {
//   validateOTP: function (otp) {
//     if(!otp) return false;
//     return this.otp === otp;
//   },
// };

// module.exports = UserOTP = mongoose.model("UserOTP", userOTPSchema);
