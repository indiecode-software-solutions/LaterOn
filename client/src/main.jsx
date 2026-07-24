import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', height: '100vh', overflow: 'auto', fontFamily: 'monospace' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>Something went wrong.</h2>
          <p style={{ fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
          <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global window error handler
window.addEventListener('error', (event) => {
  const container = document.getElementById('root');
  if (container) {
    container.innerHTML = `
      <div style="padding: 20px; background: #fee2e2; color: #991b1b; height: 100vh; overflow: auto; font-family: monospace;">
        <h2 style="margin: 0 0 10px 0; font-size: 1.2rem;">Global Error Caught:</h2>
        <p style="font-weight: bold;">\${event.message}</p>
        <pre style="font-size: 0.8rem; white-space: pre-wrap;">\${event.error ? event.error.stack : 'No stack trace available'}</pre>
      </div>
    `;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const container = document.getElementById('root');
  if (container) {
    container.innerHTML = `
      <div style="padding: 20px; background: #fee2e2; color: #991b1b; height: 100vh; overflow: auto; font-family: monospace;">
        <h2 style="margin: 0 0 10px 0; font-size: 1.2rem;">Unhandled Rejection:</h2>
        <p style="font-weight: bold;">\${event.reason ? event.reason.message || event.reason : 'Unknown rejection reason'}</p>
        <pre style="font-size: 0.8rem; white-space: pre-wrap;">\${event.reason && event.reason.stack ? event.reason.stack : 'No stack trace available'}</pre>
      </div>
    `;
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
