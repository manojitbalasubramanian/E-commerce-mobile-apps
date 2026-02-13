
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/currency'
import { checkout } from '../services/api'
import { showToast } from '../utils/toast'
import '../styles/CheckoutPage.css'

export default function CheckoutPage({ cart, onCheckout }) {
    const navigate = useNavigate()
    const location = useLocation()

    // Cart items from location state if coming from "Buy Now", else from props
    const buyNowItem = location.state?.buyNowItem
    const checkoutItems = buyNowItem ? [buyNowItem] : cart
    const isBuyNow = !!buyNowItem

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        pincode: ''
    })

    const [paymentMethod, setPaymentMethod] = useState('upi')
    const [loading, setLoading] = useState(false)

    // Calculations
    const subtotal = checkoutItems.reduce((acc, item) => acc + (item.originalPrice || item.price) * item.quantity, 0)
    const discountedSubtotal = checkoutItems.reduce((acc, item) => acc + (item.price) * item.quantity, 0)
    const discountMap = checkoutItems.reduce((acc, item) => acc + ((item.originalPrice || item.price) - item.price) * item.quantity, 0)

    // Logic for extra "Automated coupon applied" if total > some amount? 
    // For now, let's stick to the visual provided. The design shows a manual "Discount Applied - ₹3,500".
    // The logic in CartPage was:
    // subtotalOriginal - totalDiscount = subtotalDiscounted.
    // Tax was added on top.
    // The design shows: Subtotal (1,31,898) + GST (23,741) - Discount (3,500) = Total (1,52,139).
    // Let's replicate strict math:

    const tax = Math.round((discountedSubtotal * 0.18 + Number.EPSILON) * 100) / 100
    const finalTotal = Math.round((discountedSubtotal + tax + Number.EPSILON) * 100) / 100
    const totalSavings = subtotal - discountedSubtotal

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleUseLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                // Mock filling address for demo
                setFormData(prev => ({
                    ...prev,
                    city: 'Mumbai',
                    pincode: '400001',
                    address: '123, Tech Park, Andheri East'
                }))
                showToast('Location detected', 'success')
            });
        } else {
            showToast('Geolocation not available', 'error')
        }
    }

    const handlePlaceOrder = async () => {
        if (!formData.fullName || !formData.phone || !formData.address) {
            showToast('Please fill in shipping details', 'error')
            return
        }

        setLoading(true)
        try {
            // Prepare payload for backend
            // We need to send 'customer' object with name/email/etc.
            // Backend Invoice schema has customerName, customerEmail.
            // Backend checkout route expects { cart, customer }.
            // customer needs name, email is optional in schema but good to have.
            // We'll map formData to customer.
            const customerPayload = {
                name: formData.fullName,
                phone: formData.phone,
                address: formData.address, // Note: Backend currently doesn't save address in Invoice model, but we can pass it.
                // Ideally we should update backend to save address, but for now let's stick to frontend UI.
            }

            const res = await checkout(checkoutItems, customerPayload)

            showToast('Order placed successfully!', 'success')
            if (!isBuyNow) {
                onCheckout() // Clear cart
            }

            // Navigate to invoices or success page
            setTimeout(() => navigate('/invoices'), 1500)
        } catch (e) {
            showToast(e.message || 'Order failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (checkoutItems.length === 0) {
        return (
            <div className="checkout-empty">
                <h2>Your cart is empty</h2>
                <button onClick={() => navigate('/')}>Go Shopping</button>
            </div>
        )
    }

    return (
        <div className="checkout-page">
            <div className="checkout-header">
                <div className="step visited">
                    <div className="step-circle">1</div>
                    <span>SHIPPING</span>
                </div>
                <div className="step-line visited"></div>
                <div className="step active">
                    <div className="step-circle">2</div>
                    <span>DELIVERY</span>
                </div>
                <div className="step-line active"></div>
                <div className="step active">
                    <div className="step-circle">3</div>
                    <span>PAYMENT</span>
                </div>
            </div>

            <div className="checkout-layout">
                <div className="checkout-left">
                    <div className="section-title-row">
                        <h2>Shipping Details</h2>
                        <button className="location-btn" onClick={handleUseLocation}>
                            ⌖ Use Current Location
                        </button>
                    </div>

                    <div className="shipping-form">
                        <div className="form-row">
                            <div className="form-group half">
                                <label>FULL NAME</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    placeholder="Rahul Sharma"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group half">
                                <label>PHONE NUMBER</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>STREET ADDRESS</label>
                            <input
                                type="text"
                                name="address"
                                placeholder="Building name, Street, Landmark"
                                value={formData.address}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group half">
                                <label>CITY</label>
                                <input
                                    type="text"
                                    name="city"
                                    placeholder="Mumbai"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group half">
                                <label>PINCODE</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    placeholder="400001"
                                    value={formData.pincode}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    <h2 className="section-title">Secure Payment</h2>
                    <div className="payment-section">
                        <div className="payment-tabs">
                            <button
                                className={`tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('upi')}
                            >
                                UPI Payment
                            </button>
                            <button
                                className={`tab ${paymentMethod === 'card' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                Cards
                            </button>
                            <button
                                className={`tab ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('netbanking')}
                            >
                                Net Banking
                            </button>
                        </div>

                        <div className="payment-content">
                            {paymentMethod === 'upi' && (
                                <div className="upi-content">
                                    <div className="upi-text">
                                        <p>Scan QR or enter VPA to pay via your preferred UPI app.</p>
                                        <div className="vpa-box">
                                            <span className="upi-icon">UPI</span>
                                            <div className="vpa-details">
                                                <label>PAY VIA UPI ID</label>
                                                <div className="vpa-id">shree.mobiles@axis</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="qr-box">
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=shree.mobiles@axis&pn=ShreeMobiles" alt="Payment QR" />
                                    </div>
                                </div>
                            )}
                            {paymentMethod === 'card' && (
                                <div className="card-content">
                                    <p>Credit/Debit Card payment integration coming soon.</p>
                                </div>
                            )}
                            {paymentMethod === 'netbanking' && (
                                <div className="netbanking-content">
                                    <p>Net Banking options coming soon.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="checkout-right">
                    {totalSavings > 0 && (
                        <div className="coupon-card">
                            <div className="coupon-icon">🏷️</div>
                            <div className="coupon-info">
                                <h4>SHREEFEST24</h4>
                                <p>Automated coupon applied!</p>
                            </div>
                            <div className="coupon-amount">
                                -{formatCurrency(totalSavings)}
                            </div>
                        </div>
                    )}

                    <div className="order-summary">
                        <h3>Order Summary</h3>
                        <div className="summary-items">
                            {checkoutItems.map((item, idx) => (
                                <div key={idx} className="summary-item">
                                    <img src={item.image || 'https://placehold.co/60'} alt={item.name} />
                                    <div className="item-details">
                                        <h4>{item.name}</h4>
                                        <p className="item-meta">{item.description?.slice(0, 20)}</p>
                                        <div className="qty-badge">Qty: {item.quantity}</div>
                                    </div>
                                    <div className="item-price">
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="summary-totals">
                            <div className="row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(discountedSubtotal)}</span>
                            </div>
                            <div className="row">
                                <span>Shipping (Standard)</span>
                                <span className="free">FREE</span>
                            </div>
                            <div className="row">
                                <span>GST (18%)</span>
                                <span>{formatCurrency(tax)}</span>
                            </div>
                            {totalSavings > 0 && (
                                <div className="row discount">
                                    <span>Discount Applied</span>
                                    <span>-{formatCurrency(totalSavings)}</span>
                                </div>
                            )}

                            <div className="divider"></div>

                            <div className="row total">
                                <span>TOTAL AMOUNT</span>
                                <div className="total-right">
                                    <span className="amount">{formatCurrency(finalTotal)}</span>
                                    {totalSavings > 0 && <span className="savings-badge">{formatCurrency(totalSavings)} Saved</span>}
                                </div>
                            </div>
                        </div>

                        <button className="place-order-btn" onClick={handlePlaceOrder} disabled={loading}>
                            {loading ? 'Processing...' : '🔒 Place Order Now'}
                        </button>

                        <div className="security-badges">
                            <span>🛡️ Safe & Secure 256-BIT SSL</span>
                        </div>
                    </div>

                    <div className="terms-text">
                        ℹ️ By clicking 'Place Order', you agree to our terms of service and acknowledge our privacy policy. Estimated delivery by {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.
                    </div>
                </div>
            </div>
        </div>
    )
}
