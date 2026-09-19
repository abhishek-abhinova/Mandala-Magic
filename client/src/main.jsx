import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CatalogProvider, CartProvider, UiProvider } from './context';
import '../../assets/css/style.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CatalogProvider>
      <CartProvider>
        <UiProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </UiProvider>
      </CartProvider>
    </CatalogProvider>
  </React.StrictMode>
);