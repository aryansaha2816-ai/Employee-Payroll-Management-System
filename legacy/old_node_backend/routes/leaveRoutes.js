const express = require('express')
const controller = require('../controllers/leaveController')

const router = express.Router()
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

router.get('/', asyncHandler(controller.list))
router.get('/employee/:empId', asyncHandler(controller.getByEmployee))
router.get('/:id', asyncHandler(controller.getById))
router.post('/', asyncHandler(controller.create))
router.put('/:id', asyncHandler(controller.update))
router.delete('/:id', asyncHandler(controller.remove))

module.exports = router