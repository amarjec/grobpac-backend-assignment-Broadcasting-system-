const bcrypt = require('bcrypt')
const { User } = require('../models')
const { generateToken } = require('../utils/token')

const registerUser = async ({ name, email, password, role }) => {
  if (!name || !email || !password || !role) {
    return {
      statusCode: 400,
      body: { message: 'Name, email, password, and role are required' }
    }
  }

  if (!['principal', 'teacher'].includes(role)) {
    return {
      statusCode: 400,
      body: { message: 'Invalid role' }
    }
  }

  const existingUser = await User.findOne({ where: { email } })

  if (existingUser) {
    return {
      statusCode: 409,
      body: { message: 'Email already exists' }
    }
  }

  const password_hash = await bcrypt.hash(password, 10)

  const user = await User.create({
    name,
    email,
    password_hash,
    role
  })

  const token = generateToken(user)

  return {
    statusCode: 201,
    body: {
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  }
}

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    return {
      statusCode: 400,
      body: { message: 'Email and password are required' }
    }
  }

  const user = await User.findOne({ where: { email } })

  if (!user) {
    return {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)

  if (!isPasswordValid) {
    return {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }
  }

  const token = generateToken(user)

  return {
    statusCode: 200,
    body: {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  }
}

module.exports = {
  registerUser,
  loginUser
}
