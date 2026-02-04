import React from 'react'
import '../styles/Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Mobile Shop — Consultancy Project</p>
        <p className="footer-info">Professional billing & stock management system</p>
      </div>
    </footer>
  )
}
