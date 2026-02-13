import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAuthenticated, logout, getUser } from '../services/auth'
import '../styles/Navbar.css'

export default function Navbar() {
  const loggedIn = isAuthenticated()
  const user = getUser()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="nav-left">
          <Link to="/" className="nav-brand">
            <span className="brand-logo">SM</span> SHREE MOBILES
          </Link>
          <ul className="nav-links">
            <li><Link to="/" className="nav-link">Home</Link></li>
            <li><Link to="/smartphones" className="nav-link">Smartphones</Link></li>
            <li><Link to="/tablets" className="nav-link">Tablets</Link></li>
            <li><Link to="/accessories" className="nav-link">Accessories</Link></li>
            {loggedIn && user?.role === 'admin' && <li><Link to="/admin" className="nav-link" style={{ color: '#ef4444' }}>Admin</Link></li>}
          </ul>
        </div>

        <div className="nav-right">
          <div className="search-bar">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Search devices..." className="search-input" />
          </div>

          <div className="nav-icons">
            <Link to="/cart" className="icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </Link>
            {loggedIn && (
              <button onClick={handleLogout} className="icon-btn danger" title="Logout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            )}
          </div>

          {!loggedIn && (
            <div className="nav-auth">
              <Link to="/signin" className="nav-link">Sign In</Link>
              <Link to="/signup" className="nav-btn">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
