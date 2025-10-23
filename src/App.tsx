import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Env from './components/Env';
import Image from './components/Image';
import Other from './components/Other';
import Login from './components/Login';

const App: React.FC = () => {
  // ログイン状態と農場の名前を管理
  const [farmName, setFarmName] = useState<string | null>(null);

  // ログイン処理
  const handleLogin = (name: string) => {
    setFarmName(name);
  };

  // ログアウト処理
  const handleLogout = () => {
    setFarmName(null);
  };

  return (
    <Router>
      <div style={{ paddingBottom: '60px' }}>
        <Header farmName={farmName} />
        <main style={{ padding: '20px', minHeight: 'calc(100vh - 120px)' }}>
          <Routes>
            <Route path="/" element={farmName ? <Home /> : <Navigate to="/login" />} />
            <Route path="/env" element={farmName ? <Env /> : <Navigate to="/login" />} />
            <Route path="/image" element={farmName ? <Image /> : <Navigate to="/login" />} />
            <Route path="/other" element={<Other onLogout={handleLogout} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
