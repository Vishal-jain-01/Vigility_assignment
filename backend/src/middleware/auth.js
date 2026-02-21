import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
  let token = req.cookies?.auth_token

  // Fallback: check Authorization header (needed when cross-origin cookies are blocked)
  if (!token) {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export default authMiddleware
