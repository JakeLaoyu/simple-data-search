const Admin = require('../models/admin')
const Bearing = require('../models/bearing')
const Excel = require('./excel')
var path = require('path')
const XLSX = require('xlsx')

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

  if (!_ || _[ 'A2' ].v != '序号' || _[ 'B2' ].v != '姓名' || _[ 'C2' ].v != '学号' || _[ 'D2' ].v != '学院' || _[ 'E2' ].v != '联系方式' || _[ 'F2' ].v != '部门') {
    return res.json({success: false, message: 'excel格式错误，请下载模版，严格按照模版格式！！！！'})
  }

  var studentArr = [] // 遍历保存学生数据
  let studentArrIndex = 0 // 遍历保存数据索引
  var errArr = [] // 保存有误的数据

  var exist = 3
  while (exist) {
    if (_[ 'B' + exist ] && _[ 'B' + exist ].v && _[ 'C' + exist ] && _[ 'C' + exist ].v && _[ 'D' + exist ] && _[ 'D' + exist ].v) {
      let _name = ''
      let _studentId = ''
      let _tel = ''
      let _unit = ''
      let _college = ''

      if (_[ 'B' + exist ]) {
        _name = _[ 'B' + exist ].v
      }

      if (_[ 'C' + exist ]) {
        _studentId = _[ 'C' + exist ].v
      }

      if (_[ 'D' + exist ]) {
        _college = _[ 'D' + exist ].v
      }

      if (_[ 'E' + exist ]) {
        _tel = _[ 'E' + exist ].v
      }

      if (_[ 'F' + exist ]) {
        _unit = _[ 'F' + exist ].v
      }

      studentArr.push({name: _name, studentId: _studentId, tel: _tel, unit: _unit, college: _college})
      exist++
    } else {
      exist = false
    }
  }

  if (studentArr.length > 0) {
    saveStudent(studentArr[ studentArrIndex ], studentArrIndex)
  }

  // 遍历函数
  function saveStudent (item, index) {
    Student.findOne({
      '$or': [
        {
          studentId: item.studentId
        }, {
          name: item.name
        }
      ]
    }, (err, student) => {
      if (err) {
        return res.json({success: false, message: '服务端出错,请联系15988826390'})
      }
      if (student) {
        if (student.name == item.name && student.college == item.college && student.studentId == item.studentId) {
          student.unit = item.unit
          student.tel = item.tel

          student.save((err, newStudent) => {
            if (err) {
              return res.json({success: false, message: '服务端出错,请联系15988826390'})
            }
          })
        } else {
          errArr.push({studentId: item.studentId, name: item.name, err: '学号与学生姓名或者学院不一致'})
        }
      } else {
        errArr.push({studentId: item.studentId, name: item.name, err: '学号不存在(文档中错误或者学生没有绑定)'})
      }

      if (index == studentArr.length - 1) {
        // return res.json({
        // 	success: true,
        // 	errArr: errArr
        // })

        if (errArr.length > 0) {
          var header = [
            {
              caption: '学号',
              type: 'string',
              width: 20
            }, {
              caption: '姓名',
              type: 'string',
              width: 20
            }, {
              caption: '错误信息',
              type: 'string',
              width: 20
            }
          ]

          // 导出表格
          Excel.checkout(header, errArr, function (filePath) {
            return res.json({success: true, errFile: filePath})
          })
        } else {
          return res.json({success: true, message: '无错误'})
        }
      } else {
        studentArrIndex++
        saveStudent(studentArr[ studentArrIndex ], studentArrIndex)
      }
    })
  }
}
