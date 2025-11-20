import { LOAD_PROF, LOGIN_FAIL, LOGIN_REQ, LOGIN_SUCCESS, LOGOUT } from '../action-types';
import Cookies from 'js-cookie';

// Xử lý cookie user an toàn
let user = null;
const userCookie = Cookies.get('sign-language-ai-user');

if (userCookie) {
  try {
    user = JSON.parse(userCookie);
  } catch (error) {
    console.error('Failed to parse sign-language-ai-user cookie:', error);
    // Xóa cookie lỗi để tránh crash lần sau
    Cookies.remove('sign-language-ai-user');
    user = null;
  }
}

const initialState = {
  accessToken: Cookies.get('sign-language-ai-access-token') || null,
  user,
  loading: false,
  error: null
};

export const authReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case LOGIN_REQ:
      return { ...state, loading: true };

    case LOGIN_SUCCESS:
      return {
        ...state,
        accessToken: payload,
        loading: false,
        error: null
      };

    case LOGIN_FAIL:
      return {
        ...state,
        accessToken: null,
        user: null,
        loading: false,
        error: payload
      };

    case LOAD_PROF:
      return { ...state, user: payload };

    case LOGOUT:
      // Xóa cookie khi đăng xuất
      Cookies.remove('sign-language-ai-access-token');
      Cookies.remove('sign-language-ai-user');
      return { ...state, accessToken: null, user: null };

    default:
      return state;
  }
};
