const quotes = [
  {
    id: 1,
    quote:
      "Ngôn ngữ không phải là món quà di truyền, mà là món quà xã hội. Học một ngôn ngữ mới là trở thành thành viên của câu lạc bộ - cộng đồng những người nói ngôn ngữ đó."
  },
  {
    id: 2,
    quote: "Giới hạn của ngôn ngữ tôi có nghĩa là giới hạn của thế giới tôi."
  },
  {
    id: 3,
    quote:
      "Nếu bạn nói với một người đàn ông bằng ngôn ngữ anh ta hiểu, điều đó đi vào đầu anh ta. Nếu bạn nói với anh ta bằng ngôn ngữ của chính anh ta, điều đó đi vào trái tim anh ta."
  },
  {
    id: 4,
    quote: "Có một ngôn ngữ khác là sở hữu một linh hồn thứ hai."
  },
  {
    id: 5,
    quote: "Ngôn ngữ ký hiệu là món quà cao quý nhất mà Chúa đã ban cho người khiếm thính."
  },
  {
    id: 6,
    quote: "Ngôn ngữ ký hiệu là món quà cao quý nhất mà Chúa đã ban cho người khiếm thính."
  },
  {
    id: 7,
    quote: "Ngôn ngữ ký hiệu không phải là rào cản, mà là cầu nối."
  },
  {
    id: 8,
    quote: "Nói một ngôn ngữ là tiếp nhận một thế giới, một nền văn hóa."
  },
];

const randomQuote = Math.floor(Math.random() * quotes.length);

export const quote = quotes[randomQuote];
