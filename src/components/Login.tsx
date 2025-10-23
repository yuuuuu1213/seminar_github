import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [farmName, setFarmName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (farmName) {
      onLogin(farmName);
      navigate('/'); // ログイン後、ホームページへ遷移
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', margin: 'auto' }}>
        <label>
          Farm Name:
          <input
            type="text"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            style={{ padding: '8px', margin: '10px 0' }}
            required
          />
        </label>
        <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
