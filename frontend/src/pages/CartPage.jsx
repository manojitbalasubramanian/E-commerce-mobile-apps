import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkout, downloadInvoicePDF } from '../services/api'
import '../styles/CartPage.css'
import { formatCurrency } from '../utils/currency'
import { showToast } from '../utils/toast'

export default function CartPage({ cart, onUpdateQuantity, onCheckout }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [customerName, setCustomerName] = useState('')
  const navigate = useNavigate()

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  async function handleCheckout() {
    if (!customerName.trim()) {
      setMessage('Please enter your name')
      return
    }
    if (cart.length === 0) {
      setMessage('Cart is empty')
      return
    }

    setLoading(true)
    try {
      const res = await checkout(cart, { name: customerName })
      setMessage(`✓ Invoice created successfully! ID: ${res.invoice.id}`)
      showToast('Invoice created successfully', 'success')
      onCheckout()
      setCustomerName('')
      setTimeout(() => navigate('/invoices'), 1500)
    } catch (e) {
      const msg = e?.message || 'Checkout failed. Please try again.'
      setMessage('❌ ' + msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cart-page">
      <h2>Shopping Cart</h2>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <a href="/">Continue shopping</a>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>Price: {formatCurrency(item.price)}</p>
                </div>
                <div className="item-quantity">
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>−</button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                  />
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <div className="item-total">
                  {formatCurrency(item.price * item.quantity)}
                </div>
                <button
                  className="remove-btn"
                  onClick={() => onUpdateQuantity(item.id, 0)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (18%):</span>
              <span>{formatCurrency(total * 0.18)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{formatCurrency(total * 1.18)}</span>
            </div>
          </div>

          <div className="checkout-form">
            <input
              type="text"
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="customer-input"
            />
            {message && <div className="message">{message}</div>}
            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
