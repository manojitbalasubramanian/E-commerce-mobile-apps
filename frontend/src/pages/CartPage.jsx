import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { checkout, downloadInvoicePDF } from '../services/api'
import '../styles/CartPage.css'
import { formatCurrency } from '../utils/currency'
import { showToast } from '../utils/toast'

export default function CartPage({ cart, onUpdateQuantity, onCheckout }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [customerName, setCustomerName] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check for Buy Now single item purchase
  const buyNowItem = location.state?.buyNowItem
  const displayCart = buyNowItem ? [buyNowItem] : cart
  const isBuyNow = !!buyNowItem

  // Calculate amounts:
  const subtotalOriginal = displayCart.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0)
  const subtotalDiscounted = displayCart.reduce((sum, item) => sum + (item.price || item.originalPrice) * item.quantity, 0)
  const totalDiscount = subtotalOriginal - subtotalDiscounted
  const tax = Math.round((subtotalDiscounted * 0.18 + Number.EPSILON) * 100) / 100
  const total = Math.round((subtotalDiscounted * 1.18 + Number.EPSILON) * 100) / 100

  async function handleCheckout() {
    if (!customerName.trim()) {
      setMessage('Please enter your name')
      return
    }
    if (displayCart.length === 0) {
      setMessage('Cart is empty')
      return
    }

    setLoading(true)
    try {
      const res = await checkout(displayCart, { name: customerName })
      setMessage(`✓ Invoice created successfully! ID: ${res.invoice.id}`)
      showToast('Invoice created successfully', 'success')
      if (!isBuyNow) onCheckout()
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
      <h2>{isBuyNow ? 'Quick Purchase' : 'Shopping Cart'}</h2>

      {displayCart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <a href="/">Continue shopping</a>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {displayCart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="old-price">Old Price: {formatCurrency(item.originalPrice || item.price)}</p>
                  <p className="offer-price">Offer Price: {formatCurrency(item.price || item.originalPrice)}</p>
                  {item.appliedOffers && item.appliedOffers.length > 0 && (
                    <div className="applied-offers">
                      {item.appliedOffers.map((o, idx) => (
                        <div key={idx} className="applied-offer">{o.name || `${o.discountPercent}% OFF`}</div>
                      ))}
                    </div>
                  )}
                </div>
                {!isBuyNow && (
                  <>
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
                      {formatCurrency((item.price || item.originalPrice) * item.quantity)}
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => onUpdateQuantity(item.id, 0)}
                    >
                      Remove
                    </button>
                  </>
                )}
                {isBuyNow && (
                  <div className="item-total">
                    Quantity: 1<br/>
                    {formatCurrency(item.price || item.originalPrice)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal (Original):</span>
              <span>{formatCurrency(subtotalOriginal)}</span>
            </div>
            <div className="summary-row">
              <span>Discount:</span>
              <span>-{formatCurrency(totalDiscount)}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal (After Discount):</span>
              <span>{formatCurrency(subtotalDiscounted)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (18%):</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
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
