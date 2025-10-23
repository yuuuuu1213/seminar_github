import React from 'react';

const Main: React.FC = () => {
  return (
    <main style={{ padding: '20px', minHeight: 'calc(100vh - 160px)' }}> {/* ヘッダーとフッターを除いた高さ */}
      <h2>Welcome to My App</h2>
      <p>This is the main content area of the app.</p>
    </main>
  );
};

export default Main;
