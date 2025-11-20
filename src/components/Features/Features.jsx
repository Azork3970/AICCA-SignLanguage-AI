import React from 'react'
import "./Features.css"
import { featuresData } from '../../data/FeaturesData'
import Feature from './feature/Feature'

const Features = () => {
    return (
        <div className='signlang_features section__padding'>
            <div className="signlang_feature-heading">
                <h1 className="gradient__text">Cách Mạng Hóa Giao Tiếp Ngôn Ngữ Ký Hiệu Với Công Nghệ Tiên Tiến</h1>
                <p>Khám Phá Các Tính Năng</p>
            </div>

             <div className="singlang_features-container">
                {featuresData.map((data,i)=> (
                    <Feature title={data.title} text={data.text} key={i*124569}/>
                ))}
             </div>

        </div>
    )
}

export default Features
