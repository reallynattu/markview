import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { TTSProvider } from './contexts/TTSContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TTSProvider>
      <App />
    </TTSProvider>
  </React.StrictMode>
)