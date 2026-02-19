import React from 'react'
import '../styles/ComingSoonPage.css'

export default function ComingSoonPage({ title }) {
    return (
        <div className="coming-soon-container">
            <div className="coming-soon-content">
                <h1>{title}</h1>
                <div className="coming-soon-badge">Upcoming Feature</div>
                <p>We are working hard to bring you the best {title.toLowerCase()} collection. Stay tuned!</p>
                <div className="coming-soon-animation">
                    <span>⚙️</span>
                    <span>📱</span>
                    <span>🔧</span>
                </div>
            </div>
        </div>
    )
}
