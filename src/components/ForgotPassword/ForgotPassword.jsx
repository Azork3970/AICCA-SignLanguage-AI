import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../redux/actions/authaction';
import './ForgotPassword.css';

const ForgotPassword = ({ notifyMsg }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      notifyMsg('error', 'Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      await dispatch(forgotPassword(email));
      notifyMsg('success', 'Link reset mật khẩu đã được gửi đến email của bạn!');
      navigate('/login');
    } catch (err) {
      notifyMsg('error', 'Không thể gửi email reset mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h2>Quên mật khẩu</h2>
          <p>Nhập email của bạn để nhận link reset mật khẩu.</p>
        </div>

        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="forgot-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner"></div>
            ) : (
              'Gửi'
            )}
          </button>
        </form>

        <div className="forgot-password-footer">
          <button
            type="button"
            className="back-to-login-btn"
            onClick={() => navigate('/login')}
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
