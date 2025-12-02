import React, { useState, useRef } from "react";
import "./Convert.css";
import { SignImageData } from "../../data/SignImageData";

const Convert = () => {
  const [inputText, setInputText] = useState("");
  const [signImages, setSignImages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Function to convert text to sign images
  const convertTextToSigns = (text) => {
    const normalizedText = text.toLowerCase().trim();
    const images = [];

    // First, check for multi-word phrases
    const phrases = [
      "xin chào", "cảm ơn", "tạm biệt", "không được"
    ];

    let remainingText = normalizedText;
    let foundPhrase = false;

    // Check for phrases first
    for (const phrase of phrases) {
      if (remainingText.includes(phrase)) {
        const phraseSign = SignImageData.find(sign =>
          sign.name.toLowerCase() === phrase
        );
        if (phraseSign) {
          images.push(phraseSign);
          remainingText = remainingText.replace(phrase, '').trim();
          foundPhrase = true;
        }
      }
    }

    // If no phrases found or after removing phrases, process remaining words
    if (!foundPhrase || remainingText) {
      const words = remainingText.split(/\s+/);

      words.forEach(word => {
        if (word.length === 0) return;

        // Check if the whole word has a sign image (case-insensitive)
        const wordSign = SignImageData.find(sign =>
          sign.name.toLowerCase() === word.toLowerCase()
        );
        if (wordSign) {
          images.push(wordSign);
        } else {
          // Split word into letters
          const letters = word.toUpperCase().split("");
          letters.forEach(letter => {
            const letterSign = SignImageData.find(sign => sign.name === letter);
            if (letterSign) {
              images.push(letterSign);
            }
          });
        }
      });
    }

    setSignImages(images);
  };

  // Handle text input change
  const handleTextChange = (e) => {
    setInputText(e.target.value);
  };

  // Handle convert button
  const handleConvert = () => {
    if (inputText.trim()) {
      convertTextToSigns(inputText.trim());
    }
  };

  // Handle speech recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt không hỗ trợ nhận diện giọng nói.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'vi-VN'; // Vietnamese

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      convertTextToSigns(transcript);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="convert-container">
      <h1 className="gradient__text">Chuyển đổi Văn bản/Giọng nói thành Ngôn ngữ Ký hiệu</h1>

      <div className="convert-input-section">
        <textarea
          value={inputText}
          onChange={handleTextChange}
          placeholder="Nhập văn bản hoặc nhấn nút microphone để nói..."
          rows="4"
          className="convert-textarea"
        />

        <div className="convert-buttons">
          <button onClick={handleConvert} className="convert-btn">
            Chuyển đổi Văn bản
          </button>

          <button
            onClick={isListening ? stopListening : startListening}
            className={`convert-btn ${isListening ? 'listening' : ''}`}
          >
            {isListening ? 'Dừng Nghe' : '🎤 Nói'}
          </button>
        </div>
      </div>

      <div className="convert-output-section">
        <h2 className="gradient__text">Hình ảnh Ngôn ngữ Ký hiệu</h2>

        {signImages.length > 0 ? (
          <div className="sign-images-grid">
            {signImages.map((sign, index) => (
              <div key={index} className="sign-image-item">
                <img src={sign.url} alt={sign.name} />
                <p>{sign.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-signs">Nhập văn bản hoặc nói để xem hình ảnh ký hiệu.</p>
        )}
      </div>
    </div>
  );
};

export default Convert;
