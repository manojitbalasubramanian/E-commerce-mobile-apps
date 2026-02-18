import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signin, googleSignin } from '../services/auth'
import { showToast } from '../utils/toast'
import '../styles/AuthPage.css'

export default function SigninPage({ onSignin }) {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }
    if (!formData.password) {
      setError('Password is required')
      return
    }

    setLoading(true)
    try {
      await signin(formData)
      onSignin()
      showToast('Welcome back!', 'success')
      navigate('/')
    } catch (e) {
      setError(e.message)
      showToast(e.message || 'Sign in failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignin() {
    setLoading(true)
    try {
      await googleSignin()
      onSignin()
      showToast('Google Sign In successful!', 'success')
      navigate('/')
    } catch (e) {
      showToast('Google Sign In failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="signin-container">
        {/* Left Side - Brand & Hero */}
        <div className="signin-left">
          <div className="brand-logo">
            <span className="logo-badge">S</span>
            SHREE MOBILES
          </div>

          <div className="hero-image-container">
            {/* Ideally replace with an <img> of a 3D phone render */}
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(45deg, #1e293b, #0f172a)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: '4rem', opacity: 0.2 }}>📱</span>
              </div>
            </div>
          </div>

          <div className="hero-text">
            <h1>The Next Evolution<br /><span>of Connectivity.</span></h1>
            <p>Experience the precision of the 'Stitch' series. Hand-crafted digital experiences for the modern professional.</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="signin-right">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Access your Shree Mobiles dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <input
                className="input-field"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="checkbox-group">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember" className="checkbox-label">Stay signed in for 30 days</label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="divider">
              <span>OR CONTINUE WITH</span>
            </div>

            <button type="button" className="btn-google" onClick={handleGoogleSignin} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading ? 'Connecting...' : 'Sign in with Google'}
            </button>

            <div className="auth-footer-text">
              Don't have an account? <Link to="/signup" className="auth-link">Create account</Link>
            </div>

            <div className="bottom-links">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Support</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

