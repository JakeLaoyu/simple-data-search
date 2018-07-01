var path = require('path')
var excelPort = require('excel-export')
var fs = require('fs')

/**
 * [description]
 * @param  {[type]} cols    定义每列名字
 * @param  {[type]} dataArr 数据对象数组
 * @return {[type]}         [description]
 */
exports.checkout = (cols, dataArr, cb) => {
  var conf = {}
  var filename = 'excel-' // 只支持字母和数字命名

  conf.cols = cols

  // cols 示例
  // [{
  // 	caption: '学号',
  // 	type: 'string',
  // 	width: 20
  // }, {
  // 	caption: '姓名',
  // 	type: 'string',
  // 	width: 40
  // }, {
  // 	caption: '错误信息',
  // 	type: 'string',
  // 	width: 80
  // }];

  var array = []

  dataArr.map((item, index) => {
    var itemArr = []
    for (value in item) {
      itemArr.push(item[value])
    }
    array.push(itemArr)
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
    cb('/files/' + filename + random + '.xlsx')
  })
}
