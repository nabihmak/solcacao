/**
 * React entry point: mounts <App /> inside the BrowserRouter
 * and the global context providers.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* "future" flags opt in to React Router v7 behaviour and silence its console warnings */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <AuthProvider>
          {/* Student 3: shopping cart (inside AuthProvider so it can merge the guest cart on sign-in) */}
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);