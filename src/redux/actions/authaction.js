import axios from 'axios';
import Cookies from 'js-cookie';

import {
  LOAD_PROF,
  LOGIN_FAIL,
  LOGIN_REQ,
  LOGIN_SUCCESS,
  LOGOUT,
} from "../action-types";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const login = (credentials) => async (dispatch) => {
  try {
    dispatch({
      type: LOGIN_REQ,
    });

    const res = await axios.post(`${API_BASE_URL}/auth/login`, credentials);

    const accessToken = res.data.accessToken;
    const profile = res.data.profile;
    const rememberMe = credentials.rememberMe || false;

    // Set cookie expiry based on remember me
    const expires = rememberMe ? 7 : 2; // 7 days or 2 hours
    Cookies.set('sign-language-ai-access-token', accessToken, { expires });
    Cookies.set('sign-language-ai-user', JSON.stringify(profile), { expires });

    dispatch({
      type: LOGIN_SUCCESS,
      payload: accessToken,
    });

    dispatch({
      type: LOAD_PROF,
      payload: profile,
    });
  } catch (error) {
    dispatch({
      type: LOGIN_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const register = (userData) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const loginWithGoogle = () => async (dispatch) => {
  try {
    dispatch({
      type: LOGIN_REQ,
    });

    // Mock Google token for demo
    const mockToken = 'mock-google-token';

    const res = await axios.post(`${API_BASE_URL}/auth/google`, { token: mockToken });

    const accessToken = res.data.accessToken;
    const profile = res.data.profile;

    Cookies.set('sign-language-ai-access-token', accessToken, { expires: 2 });
    Cookies.set('sign-language-ai-user', JSON.stringify(profile), { expires: 2 });

    dispatch({
      type: LOGIN_SUCCESS,
      payload: accessToken,
    });

    dispatch({
      type: LOAD_PROF,
      payload: profile,
    });
  } catch (error) {
    dispatch({
      type: LOGIN_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const loginWithFacebook = () => async (dispatch) => {
  try {
    dispatch({
      type: LOGIN_REQ,
    });

    // Mock Facebook token for demo
    const mockToken = 'mock-facebook-token';

    const res = await axios.post(`${API_BASE_URL}/auth/facebook`, { token: mockToken });

    const accessToken = res.data.accessToken;
    const profile = res.data.profile;

    Cookies.set('sign-language-ai-access-token', accessToken, { expires: 2 });
    Cookies.set('sign-language-ai-user', JSON.stringify(profile), { expires: 2 });

    dispatch({
      type: LOGIN_SUCCESS,
      payload: accessToken,
    });

    dispatch({
      type: LOAD_PROF,
      payload: profile,
    });
  } catch (error) {
    dispatch({
      type: LOGIN_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const loadProfile = (profile, token) => (dispatch) => {
  dispatch({
    type: LOAD_PROF,
    payload: profile,
  });
  dispatch({
    type: LOGIN_SUCCESS,
    payload: token,
  });
};

export const forgotPassword = (email) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => async dispatch => {
  try {
    await axios.post(`${API_BASE_URL}/auth/logout`);
  } catch (error) {
    console.error('Logout API error:', error);
  }

  dispatch({
    type: LOGOUT
  });

  Cookies.remove('sign-language-ai-access-token');
  Cookies.remove('sign-language-ai-user');
};
