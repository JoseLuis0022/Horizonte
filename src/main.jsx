import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { NowProvider } from './lib/useNow';
import './index.css';

console.info(`Horizonte ${__APP_VERSION__}`);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* reducedMotion="user": con prefers-reduced-motion, Framer quita el
        desplazamiento/escala y conserva las opacidades (feedback intacto). */}
    <MotionConfig reducedMotion="user">
      <NowProvider>
        <App />
      </NowProvider>
    </MotionConfig>
  </StrictMode>
);
