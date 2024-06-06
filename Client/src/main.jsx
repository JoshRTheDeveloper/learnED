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



ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
