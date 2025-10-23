import React from 'react';

interface HeaderProps {
  farmName: string | null;
}

const Header: React.FC<HeaderProps> = ({ farmName }) => {
  return (
    <header style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', textAlign: 'center' }}>
      <h3>Agri App</h3>
      {farmName && <p>{farmName} Farm</p>}
    </header>
  );
};

export default Header;
