const express = require('express')
const controller = require('../controllers/reportController')

const router = express.Router()
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

router.get('/employees', asyncHandler(controller.employees))
router.get('/attendance', asyncHandler(controller.attendance))
router.get('/leaves', asyncHandler(controller.leaves))
router.get('/payroll', asyncHandler(controller.payroll))
router.get('/departments', asyncHandler(controller.departments))
router.get('/salary-summary', asyncHandler(controller.salarySummary))

module.exports = router