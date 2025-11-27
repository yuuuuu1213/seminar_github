import React from 'react';
import { useNavigate } from 'react-router-dom';

interface OtherProps {
  onLogout: () => void;
}

const Other: React.FC<OtherProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login'); // ログアウト後、ログインページへ遷移
  };

  return (
    <div>
      <h2>Other Page</h2>
      <button onClick={handleLogout} style={{ padding: '10px 20px', marginTop: '20px', backgroundColor: '#FF6347', color: 'white', border: 'none', cursor: 'pointer' }}>
        Logout
      </button>
    </div>
  );
};

export default Other;
