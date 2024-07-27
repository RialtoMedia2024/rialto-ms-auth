const mongoose = require('mongoose');
const autoIncrement = require('mongoose-sequence')(mongoose);
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
      auto: true
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    email: {
      type: String,
      trim: true
    },
    userType: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
      default: 'customer'
    },
    hashed_password: {
      type: String
    },
    salt: {
      type: String
    }
  },
  { timestamps: true }
);

// virtual field
userSchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = uuidv4();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

userSchema.methods = {
  authenticate: function (plainText) {
    const hashedInputPassword = this.encryptPassword(plainText, this.salt);
    return hashedInputPassword === this.hashed_password;
  },

  encryptPassword: function (password, salt) {
    if (!password) return '';
    try {
      return crypto
        .createHmac('sha1', salt || this.salt)
        .update(password)
        .digest('hex');
    } catch (err) {
      return '';
    }
  }
};

userSchema.plugin(autoIncrement, { id: 'userSeq', inc_field: 'userId' });
module.exports = User = mongoose.model('User', userSchema);
