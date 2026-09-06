import '@fontsource-variable/inter';
import '@/styles/global.scss';
import '@/styles/global.css';

import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { initMockScenarioFromUrl } from '@/services';

import App from './app';

initMockScenarioFromUrl();

const container = document.querySelector('#root');
const root = createRoot(container as HTMLElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
