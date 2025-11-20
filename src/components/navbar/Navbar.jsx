import React, { useEffect, useState } from "react";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assests/logo2.png";
import { RiMenu3Line, RiCloseLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "../../redux/actions/authaction";

const Navbar = ({ notifyMsg }) => {
  const [toggle, setToggle] = useState(false);

  const user = useSelector((state) => state.auth?.user);

  const { accessToken } = useSelector((state) => state.auth);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (isLoggedIn && user) {
      notifyMsg(
        "success",
        `Welcome! ${user?.name}, You Logged in Successfully`
      );
    }
  }, [isLoggedIn, user, notifyMsg]);

  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    dispatch(logout());
    notifyMsg("success", "Logged Out Successfully !");
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
          {accessToken ? (
            <>
              <img src={user?.photoURL} alt="user-icon" />
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
              <p>
                <Link to="/">Trang chủ</Link>
              </p>

              <p>
                <Link to="/detect">Nhận diện</Link>
              </p>

              {accessToken && (
                <p>
                  <Link to="/dashboard">Bảng điều khiển</Link>
                </p>
              )}
            </div>

            <div className="signlang__navbar-menu_container-links-authdata">
              {accessToken ? (
                <>
                  <img src={user?.photoURL} alt="user-icon" />
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
