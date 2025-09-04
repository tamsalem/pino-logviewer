import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import './index.css'

import './demos/ipc'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div  style={{ flex: 1, alignItems: 'center', alignContent:'center' }}>
      <App />
    </div>
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
