import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// StartGame now redirects to BattleMode which handles game creation properly
function StartGame() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the BattleMode page which handles quiz generation
    navigate('/admin/battle', { replace: true });
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
    }}>
      <p>Redirecting to Battle Mode...</p>
    </div>
  );
}

export default StartGame;
