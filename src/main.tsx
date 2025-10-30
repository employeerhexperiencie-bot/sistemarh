import { createRoot } from 'react-dom/client'
import { AppearanceProvider } from './contexts/AppearanceContext'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <AppearanceProvider>
    <App />
  </AppearanceProvider>
);
