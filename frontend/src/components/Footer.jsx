import React from 'react'
import '../styles/Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-col footer-brand">
          <h2><span className="brand-badge">SM</span> SHREE <span style={{ color: '#0033ff' }}>MOBILES</span></h2>
          <p className="footer-desc">
            India's leading premium smartphone destination. We bridge the gap between innovation and consumer needs with unparalleled service.
          </p>
          <div className="social-icons">
            <a href="#" className="social-icon">fb</a>
            <a href="#" className="social-icon">tw</a>
            <a href="#" className="social-icon">in</a>
          </div>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Shop</h3>
          <ul className="footer-links">
            <li><a href="#">Smartphones</a></li>
            <li><a href="#">Smartwatches</a></li>
            <li><a href="#">Tablets</a></li>
            <li><a href="#">Accessories</a></li>
            <li><a href="#">Certified Refurbished</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Support</h3>
          <ul className="footer-links">
            <li><a href="#">Order Status</a></li>
            <li><a href="#">Shipping Info</a></li>
            <li><a href="#">Returns & Warranty</a></li>
            <li><a href="#">Service Centers</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Locate Us</h3>
          <div className="map-placeholder"></div>
          <div className="address-row">
            <span>📍</span>
            <span>Flagship Store: BKC, Mumbai</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Shree Mobiles Pvt Ltd. All rights reserved.</p>
        <div className="footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </footer>
  )
}
