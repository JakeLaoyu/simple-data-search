const Admin = require('../models/admin')
const Bearing = require('../models/bearing')
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')
const excelPort = require('excel-export')

exports.index = (req, res, next) => {
  var query = req.query
  var search = query.search || ''
  var page = query.page || 1
  var count = 20 // 默认每页数量
  var index = (page - 1) * count
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

  Bearing.find(findConf).exec((err, bearings) => {
    if (err) {
      console.log(err)
    }

    let result = []
    let totalpage = 0
    if (bearings) {
      result = bearings.slice(index, index + count)
      totalpage = Math.ceil(bearings.length / count)
    }

    res.render('index', {
      title: '管理 | 列表',
      bearings: result,
      search: search,
      totalpage: totalpage || 1,
      currentpage: page || 1
    })
  })
}

exports.showLogin = (req, res) => {
  res.render('login')
}

exports.signup = function (req, res) {
  var _user = {}

  _user.name = req.body.qyname
  _user.password = req.body.qypassword

  Admin.find({
    name: _user.name
  }, function (err, user) {
    if (err) {
      console.log(err)
    }

    if (user.length) {
      return res.redirect('/signin')
    } else {
      var userModel = new Admin(_user)
      userModel.save((err, user) => {
        if (err) {
          console.log(err)
        }
        req.session.user = user
        res.json({success: true})
      })
    }
  })
}

exports.signin = function (req, res) {
  var _user = {}
  _user.name = req.body.qyname
  _user.password = req.body.qypassword

  console.log(_user)
  var name = _user.name
  var password = _user.password

  Admin.findOne({
    name: name
  }, function (err, user) {
    if (err) {
      console.log(err)
    }

    if (!user) {
      return res.json({success: false, message: '用户不存在'})
    }

    user.comparePassword(password, function (err, isMatch) {
      if (err) {
        console.log(err)
      }

      if (isMatch) {
        req.session.user = user
        return res.json({success: true})
      } else {
        return res.json({success: false, message: '密码不匹配'})
      }
    })
  })
}

// 判断用户是否为管理员
exports.adminRequired = (req, res, next) => {
  var user = req.session.user

  if (!user) {
    return res.redirect('/show/login')
  }

  next()
}

// logout
exports.logout = (req, res) => {
  delete req.session.user

  res.redirect('/admin')
}

// 解析excel
exports.import = (req, res) => {
  var file = req.file
  if (!file) {
    return res.json({success: false, message: '请选择文件'})
  }

  var workbook = XLSX.readFile(path.join(__dirname, '../', file.path))

  if (!workbook.Sheets.Sheet1) {
    return res.json({success: false, message: '表格名称错误，请设置为 Sheet1'})
  }

  var _ = workbook.Sheets.Sheet1

  if (!_ || _[ 'A1' ].v !== '型号' || _[ 'B1' ].v !== '本数') {
    return res.json({success: false, message: 'excel格式错误，请下载模版，严格按照模版格式！！！！'})
  }

  var bearingArr = [] // 遍历保存学生数据
  let bearingArrIndex = 0 // 遍历保存数据索引

  var exist = 2
  while (exist) {
    if (_[ 'A' + exist ] && _[ 'A' + exist ].v) {
      let _name = ''
      let _ben = ''

      if (_[ 'A' + exist ]) {
        _name = _[ 'A' + exist ].v
      }

      if (_[ 'B' + exist ]) {
        _ben = _[ 'B' + exist ].v
      }

      bearingArr.push({name: _name, ben: _ben})
      exist++
    } else {
      exist = false
    }
  }

  if (bearingArr.length > 0) {
    saveBearing(bearingArr[ bearingArrIndex ], bearingArrIndex)
  }

  // 遍历函数
  function saveBearing (item, index) {
    Bearing.findOne({
      '$or': [
        {
          name: item.name
        }
      ]
    }, (err, bearing) => {
      if (err) {
        return res.json({success: false, message: '服务端出错,请联系15988826390'})
      }
      if (bearing) {
        bearing.ben = item.ben
        bearing.save((err, newBearing) => {
          if (err) {
            return res.json({success: false, message: '服务端出错,请联系15988826390'})
          }
        })
      } else {
        var _bearing = new Bearing({
          name: item.name,
          ben: item.ben
        })
        _bearing.save((err, newBearing) => {
          if (err) {
            return res.json({success: false, message: '服务端出错,请联系15988826390'})
          }
        })
      }

      if (index === bearingArr.length - 1) {
        return res.json({success: true, message: '无错误'})
      } else {
        bearingArrIndex++
        saveBearing(bearingArr[ bearingArrIndex ], bearingArrIndex)
      }
    })
  }
}

// 导出数据
exports.exportData = (req, res) => {
  var header = [
    {
      caption: '型号',
      type: 'number',
      width: 20
    }, {
      caption: '本数',
      type: 'string',
      width: 20
    }
  ]

  Bearing.find({}).exec((err, Bearings) => {
    if (err) {
      return res.json({success: false, message: '导出错误'})
    }

    var conf = {}
    var filename = 'excel-' // 只支持字母和数字命名

    conf.cols = header

    var array = []

    Bearings.map((item, index) => {
      var name = item.name || ''
      var ben = item.ben || ''
      array.push([ name, ben ])
    })

    conf.rows = array
    var result = excelPort.execute(conf)

    var random = Date.parse(new Date())

    var uploadDir = path.join(__dirname, '../', '/public/files/')
    var filePath = uploadDir + filename + random + '.xlsx'

    fs.writeFile(filePath, result, 'binary', function (err) {
      if (err) {
        console.log(err)
      }
      res.json({
        success: true,
        file: '/files/' + filename + random + '.xlsx'
      })
    })
  })
}
