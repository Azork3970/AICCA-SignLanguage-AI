import axios from 'axios';

import {
  ADD_SIGN_DATA_FAIL,
  ADD_SIGN_DATA_REQ,
  ADD_SIGN_DATA_SUCCESS,
  GET_SIGN_DATA_FAIL,
  GET_SIGN_DATA_REQ,
  GET_SIGN_DATA_SUCCESS,
  GET_TOP_USERS_FAIL,
  GET_TOP_USERS_REQ,
  GET_TOP_USERS_SUCCESS,
} from "../action-types";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getSignData = () => async (dispatch) => {
  let signData = [];

  try {
    dispatch({
      type: GET_SIGN_DATA_REQ,
    });

    const token = Cookies.get('sign-language-ai-access-token');
    const res = await axios.get(`${API_BASE_URL}/data`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    signData = res.data;

    dispatch({
      type: GET_SIGN_DATA_SUCCESS,
      payload: signData,
    });
  } catch (error) {
    dispatch({
      type: GET_SIGN_DATA_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const addSignData = (data) => async (dispatch) => {
  try {
    dispatch({
      type: ADD_SIGN_DATA_REQ,
    });

    const token = Cookies.get('sign-language-ai-access-token');
    await axios.post(`${API_BASE_URL}/data`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dispatch({
      type: ADD_SIGN_DATA_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADD_SIGN_DATA_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const getTopUsers = () => async (dispatch) => {
  try {
    dispatch({
      type: GET_TOP_USERS_REQ,
    });

    const res = await axios.get(`${API_BASE_URL}/data/top-users`);
    const dataForRankBoard = res.data;

    dispatch({
      type: GET_TOP_USERS_SUCCESS,
      payload: dataForRankBoard,
    });
  } catch (error) {
    dispatch({
      type: GET_TOP_USERS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};
