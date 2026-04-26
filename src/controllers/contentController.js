const {
  uploadContent,
  getPendingContent,
  approveContent,
  rejectContent,
  getLiveContent
} = require('../services/contentService')

const uploadContentController = async (req, res) => {
  try {
    const result = await uploadContent({
      body: req.body,
      file: req.file,
      user: req.user
    })
    return res.status(result.statusCode).json(result.body)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload content' })
  }
}

const getPendingContentController = async (req, res) => {
  try {
    const result = await getPendingContent()
    return res.status(result.statusCode).json(result.body)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch pending content' })
  }
}

const approveContentController = async (req, res) => {
  try {
    const result = await approveContent({
      contentId: req.params.id,
      principalId: req.user.id
    })
    return res.status(result.statusCode).json(result.body)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to approve content' })
  }
}

const rejectContentController = async (req, res) => {
  try {
    const result = await rejectContent({
      contentId: req.params.id,
      principalId: req.user.id,
      rejectionReason: req.body.rejection_reason
    })
    return res.status(result.statusCode).json(result.body)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reject content' })
  }
}

const getLiveContentController = async (req, res) => {
  try {
    const result = await getLiveContent({
      teacherId: req.params.teacher_id
    })
    return res.status(result.statusCode).json(result.body)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch live content' })
  }
}

module.exports = {
  uploadContent: uploadContentController,
  getPendingContent: getPendingContentController,
  approveContent: approveContentController,
  rejectContent: rejectContentController,
  getLiveContent: getLiveContentController
}
