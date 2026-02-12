import React, { useState, useEffect } from 'react'
import { getToken } from '../../services/auth'
import '../../styles/OfferManagement.css'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function OfferManagement() {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        discountPercent: '',
        startDate: '',
        endDate: '',
        description: ''
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchOffers()
    }, [])

    async function fetchOffers() {
        try {
            const token = getToken()
            const res = await fetch(`${BASE}/api/offers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setOffers(data)
            }
        } catch (e) {
            console.error("Failed to fetch offers", e)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreate(e) {
        e.preventDefault()
        setError('')
        setSuccess('')

        try {
            const token = getToken()
            const res = await fetch(`${BASE}/api/offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    discountPercent: parseFloat(formData.discountPercent),
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    active: false // Default to inactive, user must toggle to apply
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create offer')

            setSuccess('Offer created successfully!')
            setFormData({
                name: '',
                discountPercent: '',
                startDate: '',
                endDate: '',
                description: ''
            })
            fetchOffers()
        } catch (e) {
            setError(e.message)
        }
    }

    async function handleToggle(offer) {
        // optimistically update UI or show loading?
        // simple approach: call API then refresh
        const isActive = offer.active
        const endpoint = isActive ? 'stop' : 'apply'

        try {
            const token = getToken()
            const res = await fetch(`${BASE}/api/offers/${offer._id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Action failed')
            }

            // Refresh offers to get updated state
            // If we applied, active becomes true. If stopped, active becomes false.
            fetchOffers()
        } catch (e) {
            alert(e.message)
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        })
    }

    return (
        <div className="offer-management">
            <div className="offer-header">
                <h2>🏷️ Offer Management</h2>
            </div>

            <div className="offer-content">
                {/* Create Offer Form */}
                <div className="create-offer-card">
                    <div className="card-header">
                        <h3>Create New Offer</h3>
                    </div>

                    <form onSubmit={handleCreate}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Offer Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Diwali Sale 2024"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Discount (%) *</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 10"
                                    min="0"
                                    max="100"
                                    value={formData.discountPercent}
                                    onChange={e => setFormData({ ...formData, discountPercent: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Offer Description (Optional)</label>
                            <textarea
                                placeholder="Enter details about this promotion..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                        {success && <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

                        <button type="submit" className="create-btn">Create Offer</button>
                    </form>
                </div>

                {/* Active & Scheduled Offers List */}
                <div className="active-offers-card">
                    <div className="card-header" style={{ justifyContent: 'space-between' }}>
                        <h3>Active & Scheduled Offers</h3>
                        <span className="badge">{offers.length} TOTAL</span>
                    </div>

                    <div className="offers-list">
                        {loading ? <p>Loading offers...</p> : offers.map(offer => (
                            <div className="offer-item" key={offer._id}>
                                <div className="offer-icon">
                                    {/* Icon based on discount or generic */}
                                    %
                                </div>
                                <div className="offer-details">
                                    <h4 className="offer-title">{offer.name}</h4>
                                    <div className="offer-meta">
                                        <span>{offer.discountPercent}% Discount</span>
                                        <span className="dot"></span>
                                        <span>
                                            {offer.active ? 'Active' : 'Inactive'}
                                        </span>
                                        {offer.endDate && (
                                            <>
                                                <span className="dot"></span>
                                                <span>Ends {formatDate(offer.endDate)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="offer-actions">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={!!offer.active}
                                            onChange={() => handleToggle(offer)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <button className="menu-btn">⋮</button>
                                </div>
                            </div>
                        ))}
                        {!loading && offers.length === 0 && (
                            <p style={{ color: '#94a3b8', textAlign: 'center' }}>No offers found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
