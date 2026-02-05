import React, { useEffect, useState } from 'react'
import { fetchProducts } from '../services/api'
import ProductList from '../components/ProductList'
import '../styles/HomePage.css'

export default function HomePage({ onAddToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts({ retries: 3 })
      .then(setProducts)
      .catch(async (e) => {
        setProducts([])
        try { const { showToast } = await import('../utils/toast'); showToast(e.message || 'Failed to load products', 'error') } catch {}
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="home-page"><p>Loading products...</p></div>
  }

  return (
    <div className="home-page">
      <section className="hero">
        <h2>Welcome to Shree Mobiles</h2>
        <p>Explore our latest mobile devices and accessories</p>
      </section>
      <section className="products-section">
        <h3>Featured Products</h3>
        <ProductList products={products} onAdd={onAddToCart} />
      </section>
    </div>
  )
}
