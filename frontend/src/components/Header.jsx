import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">Shree Mobiles</h1>
        <p className="header-subtitle">Professional billing & stock management</p>
      </div>
    </header>
  )
}
