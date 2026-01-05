import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Detect.css";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import Webcam from "react-webcam";
import { useSelector } from "react-redux";
import ProgressBar from "./ProgressBar/ProgressBar";
import DisplayImg from "../../assests/display.png";
import { SignImageData } from "../../data/SignImageData";

const Detect = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasRefVideo = useRef(null);
  const videoRef = useRef(null);
  const requestRef = useRef(null);

  const { accessToken } = useSelector((state) => state.auth);

  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [runningMode, setRunningMode] = useState("IMAGE");
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [gestureOutput, setGestureOutput] = useState("");
  const [progress, setProgress] = useState(0);

  // TTS
  const [ttsEnabled] = useState(true);

  // Video
  const [videoFile, setVideoFile] = useState(null);
  const [videoProcessing, setVideoProcessing] = useState(false);
  const [videoResults, setVideoResults] = useState([]);
  const [videoProgress, setVideoProgress] = useState(0);

  /* ================= HELPER FUNCTIONS ================= */
  const getGestureImage = (gestureName) => {
    const gesture = SignImageData.find(item =>
      item.name.toLowerCase() === gestureName.toLowerCase()
    );
    return gesture ? gesture.url : null;
  };

  /* ================= LOAD MODEL ================= */
  useEffect(() => {
    const loadModel = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "/Trained Model/sign_language_recognizer_25-04-2023.task",
        },
        numHands: 2,
        runningMode,
      });

      setGestureRecognizer(recognizer);
    };

    loadModel();
  }, [runningMode]);

  /* ================= TTS ================= */
  useEffect(() => {
    if (gestureOutput && ttsEnabled && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(gestureOutput);
      utterance.lang = "vi-VN";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  }, [gestureOutput, ttsEnabled]);

  /* ================= WEBCAM ================= */
  const predictWebcam = useCallback(() => {
    if (!gestureRecognizer || !webcamRef.current) return;

    if (runningMode === "IMAGE") {
      setRunningMode("VIDEO");
      gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }

    const nowInMs = performance.now();
    const results = gestureRecognizer.recognizeForVideo(
      webcamRef.current.video,
      nowInMs
    );

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 4,
        });
        drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 2 });
      }
    }

    if (results.gestures?.length > 0) {
      const g = results.gestures[0][0];
      setGestureOutput(g.categoryName);
      setProgress(Math.round(g.score * 100));
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  }, [gestureRecognizer, runningMode]);

  const toggleWebcam = () => {
    if (webcamRunning) {
      cancelAnimationFrame(requestRef.current);
      setWebcamRunning(false);
    } else {
      setWebcamRunning(true);
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  /* ================= VIDEO UPLOAD ================= */
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("video/")) {
      alert("Vui lòng chọn file video hợp lệ");
      return;
    }

    setVideoFile(file);
    setVideoResults([]);
    setVideoProgress(0);

    const url = URL.createObjectURL(file);
    videoRef.current.src = url;
    videoRef.current.load();
    videoRef.current.onloadedmetadata = () => {
      videoRef.current.play();
    };
  };

  /* ================= PROCESS VIDEO ================= */
  const processVideo = async () => {
    if (!videoFile || !gestureRecognizer) {
      alert("Video file hoặc gesture recognizer chưa sẵn sàng");
      return;
    }

    setVideoProcessing(true);
    setVideoResults([]);
    setVideoProgress(0);

    const video = videoRef.current;
    const canvas = canvasRefVideo.current;
    const ctx = canvas.getContext("2d");

    try {
      // Đảm bảo video đã load xong
      if (video.readyState < 2) {
        alert("Video chưa load xong, vui lòng thử lại");
        setVideoProcessing(false);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const fps = 2;
      const totalFrames = Math.floor(video.duration * fps);
      const resultsArr = [];

      console.log(`Bắt đầu xử lý video: ${totalFrames} frames`);

      for (let i = 0; i < totalFrames; i++) {
        video.currentTime = i / fps;

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout khi seek frame ${i}`));
          }, 5000);

          video.onseeked = () => {
            clearTimeout(timeout);
            resolve();
          };

          video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("Lỗi khi seek video"));
          };
        });

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const results = gestureRecognizer.recognize(imageData);

          if (results.gestures?.length > 0) {
            resultsArr.push(results.gestures[0][0].categoryName);
          }
        } catch (error) {
          console.warn(`Lỗi khi nhận dạng frame ${i}:`, error);
        }

        setVideoProgress(Math.round(((i + 1) / totalFrames) * 100));

        // Thêm delay nhỏ để tránh quá tải
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      const counts = {};
      resultsArr.forEach((s) => {
        if (s && s.trim()) {
          counts[s] = (counts[s] || 0) + 1;
        }
      });

      const final = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([sign, count]) => ({ sign, count }));

      console.log("Kết quả xử lý video:", final);
      setVideoResults(final);
      setVideoProcessing(false);

      if (final.length === 0) {
        alert("Không tìm thấy ký hiệu nào trong video. Vui lòng thử video khác có cử chỉ rõ ràng hơn.");
      }

    } catch (error) {
      console.error("Lỗi khi xử lý video:", error);
      alert(`Lỗi khi xử lý video: ${error.message}`);
      setVideoProcessing(false);
    }
  };

  /* ================= UI ================= */
  if (!accessToken) {
    return (
      <div className="signlang_detection_notLoggedIn">
        <h1 className="gradient__text">Vui Lòng Đăng Nhập!</h1>
        <img src={DisplayImg} alt="display" />
      </div>
    );
  }

  return (
    <div className="signlang_detection-container">
      {/* Webcam Section */}
      <div className="signlang_webcam-section">
        <div className="signlang_webcam-container">
          <Webcam ref={webcamRef} audio={false} className="signlang_webcam" />
          <canvas ref={canvasRef} className="signlang_canvas" />
        </div>
      </div>

      {/* Controls Section */}
      <div className="signlang_controls-section">
        <div className="signlang_controls-panel">
          <div className="signlang_webcam-controls">
            <button onClick={toggleWebcam} className="signlang_webcam-button">
              {webcamRunning ? "Dừng Webcam" : "Bắt Đầu Webcam"}
            </button>

            <div className="signlang_gesture-display">
              {gestureOutput && getGestureImage(gestureOutput) && (
                <div className="gesture_image">
                  <img
                    src={getGestureImage(gestureOutput)}
                    alt={`Sign for ${gestureOutput}`}
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'contain',
                      borderRadius: '15px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
              )}
              <div className="gesture_output">
                {gestureOutput || "Chưa phát hiện"}
              </div>
              {progress > 0 && <ProgressBar progress={progress} />}
            </div>

            <div className="tts-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={ttsEnabled}
                  readOnly
                />
                Âm thanh TTS
              </label>
            </div>
          </div>
        </div>

        {/* Video Upload Section */}
        <div className="signlang_video-container">
          <h2>Upload Video</h2>
          <div className="signlang_video-upload">
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
            />
            <button onClick={processVideo} disabled={videoProcessing}>
              {videoProcessing ? `Đang xử lý ${videoProgress}%` : "Xử Lý Video"}
            </button>
          </div>

          <div className="signlang_video-preview">
            <video
              ref={videoRef}
              controls
              muted
              playsInline
            />
          </div>
          <canvas ref={canvasRefVideo} style={{ display: "none" }} />

          {videoResults.length > 0 && (
            <div className="signlang_video-results">
              <h3>Kết Quả Nhận Diện</h3>
              <ul>
                {videoResults.map((r, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
                    {getGestureImage(r.sign) && (
                      <img
                        src={getGestureImage(r.sign)}
                        alt={`Sign for ${r.sign}`}
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{r.sign}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-subtext)' }}>{r.count} lần</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Detect;
