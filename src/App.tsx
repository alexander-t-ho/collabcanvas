import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CanvasProvider } from './contexts/CanvasContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import Login from './components/Auth/Login';
import Canvas from './components/Canvas/Canvas';
import { useRealtimeSync } from './hooks/useRealtimeSync';

const CanvasApp: React.FC = () => {
  useRealtimeSync(); // Make sure this is called!
  
  return (
    <Canvas />
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <CanvasProvider>
      <UserProfileProvider>
        <CanvasApp />
      </UserProfileProvider>
    </CanvasProvider>
  );
};

export default App;