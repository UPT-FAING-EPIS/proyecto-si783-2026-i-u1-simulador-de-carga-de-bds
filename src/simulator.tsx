import React from 'react'
import ReactDOM from 'react-dom/client'
import SimulatorApp from './SimulatorApp.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('simulator-root')!).render(
  <React.StrictMode>
    <SimulatorApp />
  </React.StrictMode>,
)
