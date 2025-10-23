import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaLeaf, FaImage, FaEllipsisH } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer style={{
      padding: '10px 0',
      backgroundColor: '#333',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-around', // 各リンクを均等に配置
      alignItems: 'center',
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
    }}>
      {/* 各リンクを均等に配置し、アイコンとテキストを縦に並べます */}
      <Link to="/" style={{ color: 'white', textAlign: 'center', textDecoration: 'none' }}>
        <FaHome size={24} />
        <div>Home</div>
      </Link>
      <Link to="/env" style={{ color: 'white', textAlign: 'center', textDecoration: 'none' }}>
        <FaLeaf size={24} />
        <div>Env</div>
      </Link>
      <Link to="/image" style={{ color: 'white', textAlign: 'center', textDecoration: 'none' }}>
        <FaImage size={24} />
        <div>Image</div>
      </Link>
      <Link to="/other" style={{ color: 'white', textAlign: 'center', textDecoration: 'none' }}>
        <FaEllipsisH size={24} />
        <div>Other</div>
      </Link>
    </footer>
  );
};

export default Footer;
