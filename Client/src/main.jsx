import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles.css';

import App from './App.jsx';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/profile.jsx';
import Error from './pages/Error';
import CreateInvoices from './pages/CreateInvoices.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: '/Dashboard',
        element: <Dashboard />
      },
      {
        path: '/CreateInvoices',
        element: <CreateInvoices />
      },
      {
        path: '/Profile',
        element: <Profile />
      },
      {
        path: '/Error',
        element: <Error />
      }
    ]
  }
]);

// Register service worker with the application's base URL
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const baseUrl = 'https://invoicinator3000-d580657ecca9.herokuapp.com/';
    const swUrl = `${baseUrl}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
