import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IranWorkspace } from './IranWorkspace';

createRoot(document.getElementById('root')!).render(<StrictMode><IranWorkspace /></StrictMode>);
