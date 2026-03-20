import React from 'react'
import ReactDOM from 'react-dom/client'
import Cortege from './Cortege'
import { HouseholdProvider } from './context/HouseholdContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HouseholdProvider>
      <Cortege />
    </HouseholdProvider>
  </React.StrictMode>,
)
