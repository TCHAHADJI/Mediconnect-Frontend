import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { UserAuth } from './components/UserAuth';
import { PublicEmergencyCardView } from './components/booklet/PublicEmergencyCardView';

interface AppRoutesProps {
  onShowAuth?: (userType: 'patient' | 'pharmacy' | 'admin' | 'health_authority', mode?: 'login' | 'signup') => void;
  onLogin?: (type: 'patient' | 'pharmacy' | 'admin' | 'health_authority', userData: any) => void;
}

export function AppRoutes({ onShowAuth, onLogin }: AppRoutesProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleShowAuth = onShowAuth || ((type, mode = 'login') => {
    navigate('/login', { state: { defaultUserType: type, initialMode: mode } });
  });

  const handleLogin = onLogin || ((type, userData) => {
    console.log('User logged in via routes:', type, userData);
    navigate('/');
  });

  const routeState = (location.state as any) || {};

  return (
    <Routes>
      <Route path="/" element={<LandingPage onShowAuth={handleShowAuth} />} />
      <Route 
        path="/login" 
        element={
          <UserAuth 
            onLogin={handleLogin} 
            defaultUserType={routeState.defaultUserType || "patient"} 
            initialMode={routeState.initialMode || "login"}
            lockUserType={true}
            onBack={() => navigate('/')} 
          />
        } 
      />
      <Route path="/emergency/:token" element={<PublicEmergencyCardView onBack={() => navigate('/')} />} />
      <Route path="/emergency-card/:token" element={<PublicEmergencyCardView onBack={() => navigate('/')} />} />
    </Routes>
  );
}

