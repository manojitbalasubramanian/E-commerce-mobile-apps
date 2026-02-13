import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/currency'
import { showToast } from '../utils/toast'

export default function ProductList({ products = [], onAdd }) {
  const navigate = useNavigate()
  const getEffectivePrice = (p) => {
    if (p.discountedPrice) return p.discountedPrice

    const now = new Date()

    // Check appliedOffers array
    const offers = Array.isArray(p.appliedOffers) ? p.appliedOffers : []
    const valid = offers.filter(o => o && o.active && typeof o.discountPercent === 'number' && o.discountPercent > 0 &&
      (!(o.startDate) || new Date(o.startDate) <= now) &&
      (!(o.endDate) || new Date(o.endDate) >= now)
    )

    if (valid.length) {
      let multiplier = 1
      valid.forEach(o => { multiplier *= (1 - (o.discountPercent / 100)) })
      const minMultiplier = 0.1
      if (multiplier < minMultiplier) multiplier = minMultiplier
      const discounted = p.price * multiplier
      return Math.round((discounted + Number.EPSILON) * 100) / 100
    }

    // Fallback for legacy single offer field
    if (p.offer && p.offer.active && p.offer.discountPercent) {
      if ((p.offer.startDate && new Date(p.offer.startDate) > now) || (p.offer.endDate && new Date(p.offer.endDate) < now)) {
        return p.price
      }
      const discounted = p.price * (1 - (p.offer.discountPercent / 100))
      return Math.round((discounted + Number.EPSILON) * 100) / 100
    }

    return p.price
  }

  return (
    <section className="product-list">
      {products.map(p => {
        const effectivePrice = getEffectivePrice(p)
        const onAddWrapped = () => {
          // Pass both effective price and original price to cart, include applied offers snapshot
          const offersSnapshot = (Array.isArray(p.appliedOffers) ? p.appliedOffers : []).filter(o => o && o.active)
          onAdd({
            ...p,
            price: effectivePrice,
            originalPrice: p.price,
            appliedOffers: offersSnapshot,
            id: p._id || p.id
          })
          showToast(`${p.name} added to cart`, 'success')
        }
        return (
          <article className="product-card" key={p._id || p.id}>
            <img src={p.image} alt={p.name} />
            <div className="product-info">
              <h3>{p.name}</h3>
              <p className="brand">{p.brand}</p>

              {effectivePrice !== p.price ? (
                <>
                  <div className="offer-badges">
                    {(Array.isArray(p.appliedOffers) ? p.appliedOffers : []).filter(o => o && o.active).map(o => (
                      <div className="offer-badge" key={String(o.offerId) + o.name}>{o.name || `${o.discountPercent}% OFF`}</div>
                    ))}
                  </div>
                  <p className="price">
                    <span className="original-price">{formatCurrency(p.price)}</span>
                    <span className="discounted-price">{formatCurrency(effectivePrice)}</span>
                  </p>
                </>
              ) : (
                <p className="price">{formatCurrency(p.price)}</p>
              )}

              <p className="stock">Stock: {p.stock}</p>
              <div className="product-actions">
                <button onClick={onAddWrapped}>Add to cart</button>
                <button className="buy-now-btn" onClick={() => {
                  const offersSnapshot = (Array.isArray(p.appliedOffers) ? p.appliedOffers : []).filter(o => o && o.active)
                  navigate('/checkout', {
                    state: {
                      buyNowItem: {
                        id: p._id || p.id,
                        _id: p._id,
                        name: p.name,
                        image: p.image,
                        quantity: 1,
                        price: effectivePrice,
                        originalPrice: p.price,
                        appliedOffers: offersSnapshot
                      }
                    }
                  })
                }}>Quick Buy</button>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
