import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './index.css';
// Side-effect imports register the built-in templates and regions.
import './templates';
import './regions';
import { App } from './ui/App';
import { loadResearchDies } from './templates/dies/research-dies';

// B.C. research glyphs arrive as a separate asset; plates re-render when it loads.
void loadResearchDies();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
