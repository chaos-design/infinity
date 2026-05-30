import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.tsx';
import '@/assets/tailwind.css';

window.addEventListener('error', (e) => {
  document.body.innerHTML += `<div style="color: red; padding: 20px; z-index: 9999; position: absolute; background: white; top: 0; left: 0;">Error: ${e.message}</div>`;
});

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            color: 'red',
            padding: '20px',
            zIndex: 9999,
            position: 'absolute',
            background: 'white',
            top: 0,
            left: 0,
          }}
        >
          Error: {this.state.error ? String(this.state.error) : 'Unknown error'}
        </div>
      );
    }
    return (this.props as any).children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
