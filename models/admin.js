var mongoose = require('mongoose')
var bcrypt = require('bcryptjs')
var SALT_WORK_FACTOR = 10

var AdminSchema = new mongoose.Schema({
  name: {
    unique: true,
    type: String
  },
  password: String,
  // 用户权限
  // 0 普通用户;
  // 1 邮件激活后的用户
  // >10 管理员
  // >50 超级管理员
  role: {
    type: Number,
    default: 0
  },
  meta: {
    createAt: {
      type: Date,
      default: Date.now()
    },
    updateAt: {
      type: Date,
      default: Date.now()
    }
  }
})

AdminSchema.pre('save', function (next) {
  var user = this
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  } else {
    this.meta.updateAt = Date.now()
  }

  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err)

    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err)

      user.password = hash
      next()
    })
  })
})

AdminSchema.methods = {
  comparePassword: function (_password, cb) {
    bcrypt.compare(_password, this.password, function (err, isMatch) {
      if (err) return cb(err)

      cb(null, isMatch)
    })
  }
}

module.exports = mongoose.model('Admin', AdminSchema)
