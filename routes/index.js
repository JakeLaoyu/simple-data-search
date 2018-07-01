var express = require('express')
var router = express.Router()
const Admin = require('../controllers/admin')
const Bearing = require('../controllers/bearing')
const Upload = require('../controllers/upload')

router.get('/', Bearing.index)
router.get('/admin', Admin.adminRequired, Admin.index)

router.get('/show/login', Admin.showLogin)
router.post('/signin', Admin.signin)
router.post('/signup', Admin.signup)
router.get('/logout', Admin.logout)

router.post('/admin/update', Admin.adminRequired, Bearing.update)
router.post('/admin/bearings/del', Admin.adminRequired, Bearing.dels)

router.post('/admin/import', Admin.adminRequired, Upload.upload.single('file'), Admin.import)
router.get('/admin/export', Admin.adminRequired, Admin.exportData)

module.exports = router
