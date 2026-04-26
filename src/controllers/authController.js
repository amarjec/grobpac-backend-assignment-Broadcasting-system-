const { registerUser, loginUser } = require('../services/authService')

const register = async (req, res) => {
  try {
    const result = await registerUser(req.body)
    return res.status(result.statusCode).json(result.body)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user' })
  }
}

const login = async (req, res) => {
  try {
    const result = await loginUser(req.body)
    return res.status(result.statusCode).json(result.body)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login' })
  }
}

module.exports = {
  register,
  login
}
