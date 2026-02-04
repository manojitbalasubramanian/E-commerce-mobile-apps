import React, { useEffect, useState } from 'react'
import { fetchProducts } from '../services/api'
import ProductList from '../components/ProductList'
import '../styles/HomePage.css'

export default function HomePage({ onAddToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="home-page"><p>Loading products...</p></div>
  }

  return (
    <div className="home-page">
      <section className="hero">
        <h2>Welcome to Mobile Shop</h2>
        <p>Explore our latest mobile devices and accessories</p>
      </section>
      <section className="products-section">
        <h3>Featured Products</h3>
        <ProductList products={products} onAdd={onAddToCart} />
      </section>
    </div>
  )
}
