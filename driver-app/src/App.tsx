import {
  IonApp,
  IonContent,
  IonPage,
  IonRouterOutlet,
  setupIonicReact,
} from '@ionic/react';

import { IonReactRouter } from '@ionic/react-router';
import { Navigate, Route } from 'react-router-dom';

import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';

setupIonicReact();

const AppRoutes: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>Restaurando sesión...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonRouterOutlet>
      <Route
        path="/login"
        element={
          session
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />

      <Route
        path="/dashboard"
        element={
          session
            ? <Dashboard />
            : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to={session ? '/dashboard' : '/login'}
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={session ? '/dashboard' : '/login'}
            replace
          />
        }
      />
    </IonRouterOutlet>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <IonApp>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>
    </IonApp>
  </AuthProvider>
);

export default App;