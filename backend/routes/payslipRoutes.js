const express = require('express')
const controller = require('../controllers/payslipController')

const router = express.Router()
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

router.get('/:employeeId/:month', asyncHandler(controller.getPayslip))

module.exports = router