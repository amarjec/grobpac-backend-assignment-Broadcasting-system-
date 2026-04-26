const express = require('express')
const {
  uploadContent,
  getPendingContent,
  approveContent,
  rejectContent,
  getLiveContent
} = require('../controllers/contentController')
const upload = require('../middlewares/uploadMiddleware')
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post(
  '/api/content/upload',
  authenticateToken,
  authorizeRoles('teacher'),
  upload.single('file'),
  uploadContent
)

router.get(
  '/api/content/pending',
  authenticateToken,
  authorizeRoles('principal'),
  getPendingContent
)

router.put(
  '/api/content/approve/:id',
  authenticateToken,
  authorizeRoles('principal'),
  approveContent
)

router.put(
  '/api/content/reject/:id',
  authenticateToken,
  authorizeRoles('principal'),
  rejectContent
)

router.get('/content/live/:teacher_id', getLiveContent)

module.exports = router
