import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/CartPage.css'
import { formatCurrency } from '../utils/currency'

export default function CartPage({ cart, onUpdateQuantity }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [promoError, setPromoError] = useState('')

  // Check for Buy Now single item purchase
  const buyNowItem = location.state?.buyNowItem
  const displayCart = buyNowItem ? [buyNowItem] : cart
  const isBuyNow = !!buyNowItem

  // Calculate amounts:
  const subtotalOriginal = displayCart.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0)
  const subtotalDiscounted = displayCart.reduce((sum, item) => sum + (item.price || item.originalPrice) * item.quantity, 0)
  const productDiscount = subtotalOriginal - subtotalDiscounted

  // Tax logic (simplified for demo to match screenshot roughly or keep existing)
  // Existing logic: Tax is 18% of discounted price
  const tax = Math.round((subtotalDiscounted * 0.18 + Number.EPSILON) * 100) / 100

  const shipping = 0 // Free

  // Total before promo
  const totalBeforePromo = subtotalDiscounted + tax + shipping

  // Final Total
  const total = totalBeforePromo - discountAmount

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'SHREE2024') {
      setDiscountAmount(5000)
      setPromoApplied(true)
      setPromoError('')
    } else {
      setPromoError('Invalid promo code')
      setDiscountAmount(0)
      setPromoApplied(false)
    }
  }

  const handleRemovePromo = () => {
    setPromoApplied(false)
    setDiscountAmount(0)
    setPromoCode('')
    setPromoError('')
  }

  return (
    <div className="cart-page">
      <div className="cart-header-nav">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} className="back-link">
          ← Continue Shopping
        </a>
      </div>

      <div className="cart-title-row">
        <h2>{isBuyNow ? 'Quick Purchase' : 'Your Shopping Cart'}</h2>
        {displayCart.length > 0 && <span className="cart-count-badge">{displayCart.length} items in your bag</span>}
      </div>

      {displayCart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <a href="/">Start shopping</a>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {displayCart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-image-placeholder">
                  {/* Ideally render item.image here */}
                  <div style={{ width: '80px', height: '80px', background: '#f0f0f0', borderRadius: '8px' }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  </div>
                </div>
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="item-variant">Titanium Black | 256GB</p> {/* Placeholder variant */}
                  <div className="price-info">
                    {/* <p className="old-price">{formatCurrency(item.originalPrice || item.price)}</p> */}
                    <p className="current-price">{formatCurrency(item.price || item.originalPrice)}</p>
                  </div>
                </div>
                {!isBuyNow && (
                  <div className="item-actions">
                    <div className="item-quantity">
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button
                      className="remove-btn-icon"
                      onClick={() => onUpdateQuantity(item.id, 0)}
                      title="Remove"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                )}
                {isBuyNow && (
                  <div className="item-total">
                    Qty: 1<br />
                    {formatCurrency(item.price || item.originalPrice)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="cart-summary-container">
            <div className="cart-summary">
              <h3>Order Summary</h3>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotalDiscounted)}</span>
              </div>
              <div className="summary-row">
                <span>GST (18%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-text">FREE</span>
              </div>

              <div className="promo-section">
                <p className="promo-label">Have a promo code?</p>
                <div className="promo-input-group">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                  />
                  {!promoApplied ? (
                    <button className="apply-btn" onClick={handleApplyPromo}>Apply</button>
                  ) : (
                    <button className="remove-promo-btn" onClick={handleRemovePromo}>✕</button>
                  )}
                </div>
                {promoError && <p className="promo-error">{promoError}</p>}
                {promoApplied && (
                  <p className="promo-success">PROMO APPLIED: {formatCurrency(discountAmount)} DISCOUNT SAVED!</p>
                )}
              </div>

              <div className="summary-row total">
                <div className="total-label">
                  <span>Total Amount</span>
                </div>
                <span className="total-amount">{formatCurrency(total)}</span>
              </div>

              <button
                className="checkout-btn"
                onClick={() => navigate('/checkout', { state: { buyNowItem: isBuyNow ? buyNowItem : null, discount: discountAmount, total: total } })}
              >
                Proceed to Checkout →
              </button>

              <div className="payment-icons-placeholder">
                {/* Icons would go here */}
                <span>💳 💳 💳</span>
              </div>
            </div>

            <div className="express-delivery-card">
              <div className="delivery-icon">🚚</div>
              <div className="delivery-text">
                <h4>Express Delivery</h4>
                <p>Orders placed now will be delivered by tomorrow, 10 AM.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
