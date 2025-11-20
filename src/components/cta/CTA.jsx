import React from 'react'
import "./CTA.css"
import { Link } from 'react-router-dom'

const CTA = () => {
    return (
        <div className='signlang_cta'>
        <div className="signlang_cta-content">
                <h3>
                    Bắt Đầu và Thử Mô Hình
                </h3>
            </div>

            <div className="signlang_cta-button">
                <button>
                    <Link to="/detect">
                      Thử Ngay!
                    </Link>
                </button>
            </div>
        </div>
    )
}

export default CTA
