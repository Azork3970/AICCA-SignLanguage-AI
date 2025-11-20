import React from "react";
import "./WhatComp.css"
import { Feature } from "../../components";
import { WhatfeatureData } from "../../data/FeaturesData";

const WhatComp = () => {
  return (
    <div className="signlang__whatsignlang section__margin" id="whatsignlang">
      <div className="signlang__whatsignlang-feature">
        <Feature
          title="Ngôn Ngữ Ký Hiệu Là Gì"
          text="Ngôn ngữ ký hiệu là một ngôn ngữ thị giác sử dụng cử chỉ tay, biểu cảm khuôn mặt và cử động cơ thể để giao tiếp. Nó được công nhận là ngôn ngữ chính thức ở nhiều quốc gia và chủ yếu được sử dụng bởi những người khiếm thính hoặc khiếm nghe."
        />
      </div>

      <div className="signlang__whatsignlang-container">
        {
          WhatfeatureData.map((data,i)=>(
            <Feature title={data.title} text={data.text} key={i*201}/>
          ))
        }
        
      </div>
    </div>
  );
};

export default WhatComp;
