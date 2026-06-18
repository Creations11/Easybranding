// src/components/SectionErrorBoundary.jsx
import React from 'react';

const c = {
  card: '#121710',
  lime: '#B8F040',
  red: '#f87171',
  text: '#EEF0E8',
  muted: '#8A9080',
  borderDim: 'rgba(255,255,255,0.06)',
};

export default class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Section Error:', this.props.name, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: c.card,
          border: '1px solid ' + c.red + '33',
          borderRadius: '14px',
          padding: '24px',
          textAlign: 'center',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</p>
          <h3 style={{ color: c.text, fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
            {this.props.name || 'Section'} failed to load
          </h3>
          <p style={{ color: c.muted, fontSize: '13px', marginBottom: '16px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onRetry) this.props.onRetry();
            }}
            style={{
              padding: '10px 20px',
              background: this.props.retryColor || c.lime,
              color: '#080A06',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          >
            {this.props.retryText || 'Retry'}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}