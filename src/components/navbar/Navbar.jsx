import React, { useState } from "react";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assests/logo2.png";
import UserIcon from "../../assests/user-icon.png";
import { RiMenu3Line, RiCloseLine } from "react-icons/ri";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/actions/authaction";
import { useTheme } from "../../context/ThemeContext";

const Navbar = ({ notifyMsg }) => {
  const [toggle, setToggle] = useState(false);

  const user = useSelector((state) => state.auth?.user);
  const { accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    dispatch(logout());
    notifyMsg("success", "Đã đăng xuất thành công!");
  };

  return (
    <div className="signlang_navbar  gradient__bg">
      <div className="singlang_navlinks">
        <div className="signlang_navlinks_logo">
          <a href="/">
            <img className="logo" src={logo} alt="logo" />
          </a>
        </div>

        <div className="signlang_navlinks_container">
          <p>
            <Link to="/">Trang chủ</Link>
          </p>

          <p>
            <Link to="/detect">Nhận diện</Link>
          </p>

          <p>
            <Link to="/convert">Chuyển đổi</Link>
          </p>

          {/* <p>
            <Link to="/guide">Hướng dẫn</Link>
          </p> */}

          {accessToken && (
            <p>
              <Link to="/dashboard">Bảng điều khiển</Link>
            </p>
          )}
        </div>

        <div className="signlang_auth-data">
          <button type="button" onClick={toggleTheme} className="theme-toggle-btn">
            {isDarkMode ? <MdLightMode size={24} /> : <MdDarkMode size={24} />}
          </button>
          {accessToken ? (
            <>
              <img src={user?.photoURL || UserIcon} alt="user-icon" />
              <button type="button" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <button type="button" onClick={handleLogin}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      <div className="signlang__navbar-menu">
        {toggle ? (
          <RiCloseLine
            color="#fff"
            size={27}
            onClick={() => setToggle(false)}
          />
        ) : (
          <RiMenu3Line color="#fff" size={27} onClick={() => setToggle(true)} />
        )}
        {toggle && (
          <div className="signlang__navbar-menu_container scale-up-center">
            <div className="signlang__navbar-menu_container-links">
              <p className="gradient__text">
                <Link to="/">Trang chủ</Link>
              </p>

              <p className="gradient__text">
                <Link to="/detect">Nhận diện</Link>
              </p>

              <p className="gradient__text">
                <Link to="/convert">Chuyển đổi</Link>
              </p>

              {accessToken && (
                <p className="gradient__text">
                  <Link to="/dashboard">Bảng điều khiển</Link>
                </p>
              )}
            </div>

            <div className="signlang__navbar-menu_container-links-authdata">
              <button type="button" onClick={toggleTheme} className="theme-toggle-btn">
                {isDarkMode ? <MdLightMode size={24} /> : <MdDarkMode size={24} />}
              </button>
              {accessToken ? (
                <>
                  <img src={user?.photoURL || UserIcon} alt="user-icon" />
                  <button type="button" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <button type="button" onClick={handleLogin}>
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
