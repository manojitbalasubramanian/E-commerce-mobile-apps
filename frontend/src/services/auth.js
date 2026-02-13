const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export async function signup(userData) {
  const r = await fetch(BASE + '/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  if (!r.ok) {
    const error = await r.json()
    throw new Error(error.message || 'Signup failed')
  }
  const data = await r.json()
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export async function signin(credentials) {
  const r = await fetch(BASE + '/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  })
  if (!r.ok) {
    const error = await r.json()
    throw new Error(error.message || 'Signin failed')
  }
  const data = await r.json()
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getUser() {
  const user = localStorage.getItem('user')
  try {
    return user ? JSON.parse(user) : null
  } catch (e) {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
  }
}

export function isAuthenticated() {
  return !!getToken()
}

export function getAuthHeader() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
