import { useNavigate } from 'react-router-dom';

function Header({ title, showBack = true }) {
  const navigate = useNavigate();

  return (
    <div className="header">
      {showBack && (
        <button className="header-back" onClick={() => navigate('/')}>
          ←
        </button>
      )}
      <span className="header-title">{title}</span>
    </div>
  );
}

export default Header;
