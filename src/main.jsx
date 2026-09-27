import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Keep the HTML loading screen visible while the application chunk downloads.
import('./App.jsx')
  .then(({ default: App }) => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Unable to start Baby Milk Tracker:', error)
    window.dispatchEvent(new Event('babyapp:error'))
  })
