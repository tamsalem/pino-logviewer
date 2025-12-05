import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'

import './index.css'

import './demos/ipc'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <div  style={{ flex: 1, alignItems: 'center', alignContent:'center' }}>
        <App />
      </div>
    </ThemeProvider>
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
