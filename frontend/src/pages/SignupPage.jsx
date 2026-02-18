import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup, googleSignin } from '../services/auth'
import { showToast } from '../utils/toast'
import '../styles/AuthPage.css'

export default function SignupPage({ onSignup }) {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [step, setStep] = useState(1) // 1: Details, 2: Security
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  function validateStep1() {
    if (!formData.name.trim()) return 'Full Name is required'
    if (!formData.email.trim()) return 'Email is required'
    if (!formData.businessName.trim()) return 'Business Name is required'
    if (!formData.phone.trim()) return 'Phone Number is required'
    return null
  }

  function validateStep2() {
    if (!formData.password) return 'Password is required'
    if (formData.password.length < 6) return 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
    if (!formData.agreeToTerms) return 'You must agree to the Terms and Conditions'
    return null
  }

  function handleContinue(e) {
    e.preventDefault()
    const err = validateStep1()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validateStep2()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setLoading(true)

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        phone: formData.phone
      })
      onSignup()
      showToast('Account created', 'success')
      navigate('/')
    } catch (e) {
      setError(e.message)
      showToast(e.message || 'Signup failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignin() {
    setLoading(true)
    try {
      await googleSignin()
      onSignup()
      showToast('Google Sign Up successful!', 'success')
      navigate('/')
    } catch (e) {
      showToast('Google Sign Up failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper" style={{ background: '#f8f9fe' }}>
      <div className="signup-container">
        <div className="brand-logo" style={{ justifyContent: 'center', marginBottom: '2rem', color: '#0f172a' }}>
          <span className="logo-badge">S</span>
          SHREE MOBILES
        </div>

        <div className="signup-header">
          <h1>Premium Retailer Portal</h1>
          <p>Join the network of elite mobile retailers.</p>
        </div>

        <div className="stepper">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-circle">
              {step > 1 ? '✓' : '1'}
            </div>
            <div className="step-label">Details</div>
          </div>
          <div className="stepper-line" style={{ background: step >= 2 ? '#0033ff' : '#f1f5f9' }}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <div className="step-label">Security</div>
          </div>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleContinue} className="modern-form">
            <div className="input-group">
              <label className="input-label" htmlFor="name">Full Name</label>
              <input
                className="input-field"
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John wick"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="businessName">Business Name</label>
              <input
                className="input-field"
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Shree Mobiles Pvt. Ltd."
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="email">Professional Email</label>
              <input
                className="input-field"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@gmail.com"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="phone">Phone Number</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{
                  background: '#f1f5f9',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontWeight: '600'
                }}>+1</div>
                <input
                  className="input-field"
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="1234567890"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Continue to Security →
            </button>

            <div className="divider">
              <span>OR JOIN WITH</span>
            </div>

            <button type="button" className="btn-google" onClick={handleGoogleSignin} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading ? 'Connecting...' : 'Sign up with Google'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
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

            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                className="input-field"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                disabled={loading}
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
              />
              <label htmlFor="agreeToTerms" className="checkbox-label">
                I agree to the <Link to="/terms" className="auth-link">Terms and Conditions</Link>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer-text">
          Already have an account? <Link to="/signin" className="auth-link">Log in here</Link>
        </div>

        <div className="secure-badge">
          <span>🔒 Secure 256-bit Encryption</span>
          <span>•</span>
          <span>🛡️ PCI Compliant</span>
        </div>

        <div className="bottom-links" style={{ marginTop: '2rem' }}>
          <span>Need Assistance? Contact Support</span>
        </div>
      </div>
    </div>
  )
}

