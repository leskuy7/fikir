import React from 'react';

export default class HataSiniri extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hataVar: false };
  }

  static getDerivedStateFromError() {
    return { hataVar: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HataSiniri yakaladı:', error, errorInfo);
  }

  render() {
    if (this.state.hataVar) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h2>Bir şeyler ters gitti</h2>
          <p>Sayfayı yenileyerek tekrar deneyebilirsin.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
