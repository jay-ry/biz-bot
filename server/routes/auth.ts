import { Hono } from 'hono'
import { handleSignUp, handleLogin } from '../controller/auth.controller'

const auth = new Hono()

/** POST /api/auth/signup — register a new user and organization */
auth.post('/signup', handleSignUp)

/** POST /api/auth/login  — authenticate and receive a JWT */
auth.post('/login', handleLogin)

export default auth
