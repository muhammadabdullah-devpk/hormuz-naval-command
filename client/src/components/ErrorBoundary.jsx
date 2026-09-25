import React from 'react';
import { Anchor } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled runtime error in Fleet Command UI:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100vw', background: '#f8fafc', color: '#0f172a',
          fontFamily: 'Inter, sans-serif', padding: '24px', boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '560px', width: '100%', background: '#ffffff',
            border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '50%',
                background: 'rgba(10,95,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Anchor style={{ width: '28px', height: '28px', color: '#0a5fa8' }} />
              </div>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#0a5fa8' }}>
              Hormuz Maritime AIS Console
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
              The application encountered a rendering issue and has been safely intercepted.
            </p>
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '12px', textAlign: 'left', marginBottom: '20px',
              fontFamily: 'monospace', fontSize: '12px', color: '#991b1b', overflowX: 'auto'
            }}>
              {this.state.error?.toString() || 'Unknown runtime error'}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                background: '#0a5fa8', color: '#ffffff', border: 'none',
                borderRadius: '8px', padding: '10px 20px', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              Reload Live Console
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
