const express = require('express')
const controller = require('../controllers/departmentController')

const router = express.Router()
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

router.get('/', asyncHandler(controller.list))
router.get('/:id/employees', asyncHandler(controller.employees))
router.get('/:id', asyncHandler(controller.getById))
router.post('/', asyncHandler(controller.create))
router.put('/:id', asyncHandler(controller.update))
router.delete('/:id', asyncHandler(controller.remove))

module.exports = router
