import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('New app available. Reload?')) {
            updateSW(true);
        }
    },
});

ReactDOM.createRoot(document.getElementById(`root`)!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
