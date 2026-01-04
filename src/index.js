import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import { ProgressProvider } from './context/ProgressContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ProgressProvider>        {}
        <Router>
          <App />
        </Router>
      </ProgressProvider>
    </Provider>
  </React.StrictMode>
);
