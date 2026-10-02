import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
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

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

Element.prototype.scrollTo = () => {};

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          {this.state.error ? String(this.state.error) : 'Unknown error'}
        </div>
      );
    }
    return (this.props as any).children;
  }
}

describe('App render', () => {
  it('should render without crashing', async () => {
    render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
    await waitFor(
      () => {
        const error = screen.queryByTestId('error-boundary');
        if (error) throw new Error(error.textContent || 'error');
        expect(
          screen.queryByText('Open Tabs') || document.body,
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
