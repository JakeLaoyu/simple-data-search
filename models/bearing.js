var mongoose = require('mongoose')
var Schema = mongoose.Schema

var BearingSchema = new Schema({
  name: String, // 型号
  ben: String, // 本数
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

BearingSchema.pre('save', function (next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  } else {
    this.meta.updateAt = Date.now()
  }

  next()
})

module.exports = mongoose.model('Bearing', BearingSchema)
