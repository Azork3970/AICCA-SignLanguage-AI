import React from 'react'
import "./Working.css"
import WorkingImg from "../../assests/Working.png";

const Working = () => {
  return (
    <div className='signlang_working section__padding'>
        <div className="signlang_working-img">
          <img src={WorkingImg} alt="working" />
        </div>

        <div className="signlang_working-content">
          <h1 className="gradient__text">Tìm Hiểu Cách Nó Hoạt Động!</h1>
          <p>
            Để sử dụng hệ thống nhận dạng ngôn ngữ ký hiệu, bạn chỉ cần để tay được phát hiện và thực hiện một ký hiệu. Khi bạn thực hiện một ký hiệu, hãy tham khảo hướng dẫn để biết từ tương ứng. Hệ thống sẽ quét tay bạn và sử dụng mô hình tích hợp để dự đoán ký hiệu bạn đã thực hiện. Cuối cùng, lớp dự đoán sẽ được hiển thị, cho phép bạn giao tiếp hiệu quả thông qua ngôn ngữ ký hiệu. Với hệ thống này, bạn có thể thu hẹp khoảng cách giao tiếp giữa người dùng ngôn ngữ ký hiệu và người không dùng ngôn ngữ ký hiệu, giúp mọi người dễ dàng kết nối và tương tác hơn.
          </p>
        </div>
    </div>
  )
}

export default Working