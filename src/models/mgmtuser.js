// const mongoose = require('mongoose');
// const autoIncrement = require('mongoose-sequence')(mongoose);
// const crypto = require('crypto');
// const {v4 : uuidv4} = require('uuid');


// const mgmtUserSchema = new mongoose.Schema(
//     {
//         userId: {
//           type: Number,
//           unique: true,
//           auto: true
//         },
//         name: {
//             type: String,
//             trim: true,
//             required: true,
//             maxlength: 50
//         },
//         email: {
//             type: String,
//             trim: true,
//             required: true,
//             unique: true
//         },
//         mobile: {
//             type: String,
//             trim: true,
//             required: true,
//             unique: true
//         },
//         userType: {
//             type: String,
//             trim: true,
//             required: true,
//             maxlength: 32,
//             default: "ADMIN"
//         },
//         isDeleted: {
//             type: Boolean,
//             default: false
//         },
//         hashed_password: {
//             type: String,
//             required: true
//         },
//         salt: String,
//     },
//     { timestamps: true }
// );

// // virtual field
// mgmtUserSchema
//     .virtual('password')
//     .set(function(password) {
//         this._password = password;
//         this.salt = uuidv4();
//         this.hashed_password = this.encryptPassword(password);
//     })
//     .get(function() {
//         return this._password;
//     });

// mgmtUserSchema.methods = {
//     authenticate: function(plainText) {
//         return this.encryptPassword(plainText) === this.hashed_password;
//     },

//     encryptPassword: function(password) {
//         if (!password) return '';
//         try {
//             return crypto
//                 .createHmac('sha1', this.salt)
//                 .update(password)
//                 .digest('hex');
//         } catch (err) {
//             return '';
//         }
//     }
// };

// mgmtUserSchema.plugin(autoIncrement, {id:'mgmtUserSeq',inc_field: 'userId'});
// module.exports = MgmtUser = mongoose.model('MgmtUser', mgmtUserSchema);
