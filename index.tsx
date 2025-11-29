import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * ENTRY POINT
 * This file mounts the React application to the DOM.
 * It uses the modern React 18 `createRoot` API.
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);

// StrictMode is enabled to highlight potential problems in the application.
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
