
import { useState } from 'react';

import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
} from '@ionic/react';

import {
  eye,
  eyeOff,
  lockClosed,
  person,
} from 'ionicons/icons';

import { useAuth } from '../../context/useAuth';

import './Login.css';

const Login: React.FC = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setToastMessage('Ingresa tu correo y contraseña.');
      setShowToast(true);
      return;
    }

    try {
      setIsLoading(true);

      await login({
        email: email.trim(),
        password,
      });

      // App.tsx detectará la sesión y redirigirá al Dashboard.
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión.';

      setToastMessage(message);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-content">
        <div className="login-container">

          <div className="login-brand">
            <div className="login-logo">
              <IonIcon icon={person} />
            </div>

            <h1>RouteMind</h1>
            <span>DRIVER</span>

            <p>Tu jornada de entregas, bajo control.</p>
          </div>

          <div className="login-card">

            <div className="login-heading">
              <h2>Bienvenido</h2>
              <p>Inicia sesión para acceder a tus rutas.</p>
            </div>

            <form onSubmit={handleSubmit}>

              <IonItem className="login-input" lines="none">
                <IonIcon icon={person} slot="start" />

                <IonInput
                  type="email"
                  label="Correo electrónico"
                  labelPlacement="stacked"
                  placeholder="conductor@empresa.com"
                  value={email}
                  onIonInput={(event) =>
                    setEmail(event.detail.value ?? '')
                  }
                  autocomplete="username"
                  required
                  disabled={isLoading}
                />
              </IonItem>

              <IonItem className="login-input" lines="none">
                <IonIcon icon={lockClosed} slot="start" />

                <IonInput
                  type={showPassword ? 'text' : 'password'}
                  label="Contraseña"
                  labelPlacement="stacked"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onIonInput={(event) =>
                    setPassword(event.detail.value ?? '')
                  }
                  autocomplete="current-password"
                  required
                  disabled={isLoading}
                />

                <IonButton
                  fill="clear"
                  color="medium"
                  slot="end"
                  type="button"
                  disabled={isLoading}
                  aria-label={
                    showPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  <IonIcon
                    icon={showPassword ? eyeOff : eye}
                  />
                </IonButton>
              </IonItem>

              <IonButton
                expand="block"
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <IonSpinner name="crescent" />
                    <span style={{ marginLeft: '10px' }}>
                      Iniciando sesión...
                    </span>
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </IonButton>

            </form>

            <div className="login-footer">
              <IonText color="medium">
                <p>
                  Acceso exclusivo para conductores autorizados.
                </p>
              </IonText>
            </div>

          </div>

          <div className="login-version">
            RouteMind Driver · Versión 1.0
          </div>

        </div>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          position="bottom"
          color="danger"
          onDidDismiss={() => setShowToast(false)}
        />

      </IonContent>
    </IonPage>
  );
};

export default Login;
