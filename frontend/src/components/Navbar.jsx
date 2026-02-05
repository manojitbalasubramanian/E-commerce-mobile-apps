import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUser, logout, isAuthenticated } from '../services/auth'
import '../styles/Navbar.css'

export default function Navbar({ isLoggedIn, user, onLogout }) {
  const [displayUser, setDisplayUser] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn && user) {
      setDisplayUser(user)
    } else {
      setDisplayUser(null)
    }
  }, [isLoggedIn, user])

  function handleLogout() {
    logout()
    onLogout()
    navigate('/')
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="nav-brand">🏪 Shree Mobiles</Link>

          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setShowMenu((s) => !s)}
          >
            <span className={`hamburger ${showMenu ? 'open' : ''}`} />
          </button>

          <ul className={`nav-menu ${showMenu ? 'active' : ''}`} onClick={() => setShowMenu(false)}>
            <li className="nav-item">
              <Link to="/" className="nav-link">Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/cart" className="nav-link">Cart</Link>
            </li>
            <li className="nav-item">
              <Link to="/invoices" className="nav-link">Invoices</Link>
            </li>
            {isLoggedIn && displayUser?.role === 'admin' && (
              <>
                <li className="nav-item">
                  <Link to="/admin" className="nav-link admin-link">⚙️ Admin</Link>
                </li>
              </>
            )}
            {isLoggedIn ? (
              <>
                <li className="nav-item">
                  <span className="nav-user">👤 {displayUser?.name || 'User'}</span>
                </li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="nav-link logout-btn">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/signin" className="nav-link auth-link">Sign In</Link>
                </li>
                <li className="nav-item">
                  <Link to="/signup" className="nav-link signup-link">Sign Up</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
    </>
  )
}
