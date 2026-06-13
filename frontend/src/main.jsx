import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e1b4b',
            color: '#e0e7ff',
            borderRadius: '8px',
            fontSize: '14px',
            border: '1px solid #3730a3',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#e0e7ff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fee2e2' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
