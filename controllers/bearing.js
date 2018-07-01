const Bearing = require('../models/bearing')

exports.index = (req, res) => {
  var search = req.query.search
  var searchReg = new RegExp(search)

  var findConf = {}

  if (search) {
    findConf = {
      '$or': [
        {
          name: searchReg
        }
      ]
    }
  }

  Bearing
    .find(findConf)
    .exec((err, bearings) => {
      if (err) {
        console.log(err)
      }

      res.render('search', {
        title: '搜索',
        search: search || '',
        bearings: bearings
      })
    })
}

exports.save = (req, res) => {
  var name = req.body.name
  var ben = req.body.ben

  var _bearing = new Bearing({
    name,
    ben
  })

  _bearing.save((err, bearing) => {
    if (err) {
      console.log(err)
    }
    res.json({
      success: true,
      bearing
    })
  })
}

// 删除多个
exports.dels = (req, res) => {
  var ids = req.body[ 'ids[]' ]

  Bearing.find({
    _id: {
      '$in': ids
    }
  })
    .exec((err, bearings) => {
      if (err) {
        console.log(err)
      }
      bearings.forEach((item, index) => {
        item.remove()

        if (index === bearings.length - 1) {
          res.json({
            success: true
          })
        }
      })
    })
}

// 修改信息
exports.update = (req, res) => {
  var id = req.body.id
  var name = req.body.name.trim()
  var ben = req.body.ben.trim()

  if (!id) {
    // 新增
    new Bearing({
      name,
      ben
    }).save((err, newBearing) => {
      if (err) {
        console.log(err)
      }

      res.json({
        success: true,
        bearing: newBearing
      })
    })
  } else {
    // 修改
    Bearing.findOne({
      _id: id
    }, (err, bearing) => {
      if (err) {
        return res.json({
          success: false,
          message: '服务端错误'
        })
      }

      if (name) {
        bearing.name = name
      }
      if (ben) {
        bearing.ben = ben
      }

      bearing.save((err, newBearing) => {
        if (err) {
          return res.json({
            success: false,
            message: '服务端错误'
          })
        }
        res.json({
          success: true,
          bearing: newBearing
        })
      })
    })
  }
}

// 搜索
exports.searchDate = (req, res) => {
  var name = req.body.name

  Bearing.findOne({
    name
  })
    .exec((err, bearing) => {
      if (err) {
        console.log(err)
      }

      if (bearing) {
        res.json({
          success: true,
          date: bearing
        })
      } else {
        res.json({
          success: false,
          message: '型号不存在'
        })
      }
    })
}
