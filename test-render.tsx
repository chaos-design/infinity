import { render } from '@testing-library/react';
import App from './entrypoints/newtab/app';

// Mock chrome
(global as any).chrome = {
  tabs: {
    query: async () => [],
    onUpdated: { addListener: () => {}, removeListener: () => {} },
    onRemoved: { addListener: () => {}, removeListener: () => {} },
    onCreated: { addListener: () => {}, removeListener: () => {} },
  },
  storage: {
    local: {
      get: (_keys: any, cb: any) => cb({}),
      set: () => {},
    },
    onChanged: { addListener: () => {}, removeListener: () => {} },
  },
};

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

try {
  const { container } = render(<App />);
  console.log('Render successful!');
} catch (e) {
  console.error('RENDER ERROR:', e);
}
