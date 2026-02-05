import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated, getUser } from './services/auth'
import Navbar from './components/Navbar'
import Header from './components/Header'
import Footer from './components/Footer'
import Toast from './components/Toast'
import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import InvoicesPage from './pages/InvoicesPage'
import SignupPage from './pages/SignupPage'
import SigninPage from './pages/SigninPage'
import AdminPage from './pages/AdminPage'
import './styles.css'

export default function App() {
  const [cart, setCart] = useState([])
  const [loggedIn, setLoggedIn] = useState(isAuthenticated())
  const [user, setUser] = useState(getUser())

  useEffect(() => {
    setLoggedIn(isAuthenticated())
    setUser(getUser())
  }, [])

  function addToCart(product) {
    const normalizedId = product.id || product._id
    setCart(prev => {
      const existing = prev.find(p => p.id === normalizedId)
      if (existing) return prev.map(p => p.id === normalizedId ? { ...p, quantity: p.quantity + 1 } : p)

      const item = {
        id: normalizedId,
        _id: product._id,
        name: product.name,
        image: product.image,
        quantity: 1,
        price: product.price, // effective / offer price
        originalPrice: product.originalPrice || product.price,
        appliedOffers: product.appliedOffers || []
      }
      return [...prev, item]
    })
  }

  function updateQuantity(id, qty) {
    setCart(prev => prev.map(p => p.id === id ? { ...p, quantity: qty } : p).filter(p => p.quantity > 0))
  }

  function clearCart() {
    setCart([])
  }

  function handleSignup() {
    setLoggedIn(true)
    setUser(getUser())
  }

  function handleSignin() {
    setLoggedIn(true)
    setUser(getUser())
  }

  function handleLogout() {
    setLoggedIn(false)
    setUser(null)
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar isLoggedIn={loggedIn} user={user} onLogout={handleLogout} />
        <Header />
        <Toast />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage onAddToCart={addToCart} />} />
            <Route path="/cart" element={loggedIn ? <CartPage cart={cart} onUpdateQuantity={updateQuantity} onCheckout={clearCart} /> : <Navigate to="/signin" />} />
            <Route path="/invoices" element={loggedIn ? <InvoicesPage /> : <Navigate to="/signin" />} />
            <Route path="/admin" element={loggedIn && user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" />} />
            <Route path="/signup" element={loggedIn ? <Navigate to="/" /> : <SignupPage onSignup={handleSignup} />} />
            <Route path="/signin" element={loggedIn ? <Navigate to="/" /> : <SigninPage onSignin={handleSignin} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}
