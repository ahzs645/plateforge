import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IraqWorkspace } from './IraqWorkspace';

createRoot(document.getElementById('root')!).render(<StrictMode><IraqWorkspace /></StrictMode>);
