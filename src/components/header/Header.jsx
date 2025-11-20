import React from 'react'
import "./Header.css"
import SignHand from "../../assests/SignHand.png";

const Header = () => {
  return (
    <div className="signlang__header section__padding gradient__bg" id="home">

    <div className="signlang__header-content">
      <h1 className="gradient__text">Tăng cường sức mạnh não bộ với SLR.</h1>
      <p>
      Các nghiên cứu đã chứng minh rằng học ngôn ngữ ký hiệu giúp bạn giữ vững khi tuổi cao và tăng cường sức nghĩ. Ngoài ra, học ngôn ngữ ký hiệu sẽ giúp bạn giao tiếp với 72 triệu người nói trên toàn thế giới. Hãy thử công cụ của chúng tôi, Học và Luyện tập Ngôn ngữ Ký hiệu và Vui vẻ
      </p>

    </div>
    <div className="signlang__header-image">
      <img src={SignHand} alt='SIGN-HAND'/>
    </div>
  </div>
  )
}

export default Header