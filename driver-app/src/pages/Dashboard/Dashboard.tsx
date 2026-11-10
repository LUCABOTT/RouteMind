
import { useCallback, useEffect, useState } from 'react';

import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

import {
  carOutline,
  locationOutline,
  personCircleOutline,
  refreshOutline,
  logOutOutline,
} from 'ionicons/icons';

import { useAuth } from '../../context/useAuth';
import { driverService } from '../../Services/driver/driver.service';

import type { DriverProfile } from '../../interfaces/driver.interface';

import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { session, logout } = useAuth();

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPerfil = useCallback(async () => {
    if (!session?.token) {
      setError('No se encontró una sesión válida.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await driverService.getProfile(session.token);

      setProfile(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible obtener tu información.',
      );
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil]);

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return 'success';
      case 'EN_RUTA':
        return 'primary';
      case 'MANTENIMIENTO':
        return 'warning';
      default:
        return 'medium';
    }
  };

  const formatearEstado = (estado: string) => {
    return estado.replaceAll('_', ' ');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>RouteMind Driver</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding dashboard-content">

        {loading && (
          <div className="dashboard-loading">
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p>Consultando tu información...</p>
            </IonText>
          </div>
        )}

        {!loading && error && (
          <div className="dashboard-error">
            <IonText color="danger">
              <h2>No pudimos cargar tu perfil</h2>
              <p>{error}</p>
            </IonText>

            <IonButton
              expand="block"
              onClick={() => void cargarPerfil()}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Reintentar
            </IonButton>
          </div>
        )}

        {!loading && profile && (
          <>
            <section className="dashboard-welcome">
              <div>
                <p className="dashboard-eyebrow">
                  PANEL DEL CONDUCTOR
                </p>

                <h1>
                  Hola, {profile.conductor.nombre}
                </h1>

                <p>
                  Bienvenido a tu espacio de trabajo.
                </p>
              </div>

              <div className="dashboard-avatar">
                <IonIcon icon={personCircleOutline} />
              </div>
            </section>

            <IonCard className="dashboard-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={personCircleOutline} />
                  Mi perfil
                </IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                <div className="dashboard-info-row">
                  <span>Nombre</span>
                  <strong>{profile.conductor.nombre}</strong>
                </div>

                <div className="dashboard-info-row">
                  <span>Correo electrónico</span>
                  <strong>{profile.usuario.email}</strong>
                </div>

                <div className="dashboard-info-row">
                  <span>Teléfono</span>
                  <strong>{profile.conductor.telefono || 'No registrado'}</strong>
                </div>

                <div className="dashboard-info-row">
                  <span>Licencia</span>
                  <strong>{profile.conductor.licencia || 'No registrada'}</strong>
                </div>

                <div className="dashboard-info-row">
                  <span>Identificador</span>
                  <strong>#{profile.conductor.id}</strong>
                </div>
              </IonCardContent>
            </IonCard>

            <section className="dashboard-section-heading">
              <h2>Mis vehículos</h2>
              <span>{profile.vehiculos.length} asignados</span>
            </section>

            {profile.vehiculos.length === 0 && (
              <IonCard className="dashboard-card">
                <IonCardContent>
                  <div className="dashboard-empty">
                    <IonIcon icon={carOutline} />
                    <p>No tienes vehículos asignados actualmente.</p>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {profile.vehiculos.map((vehiculo) => (
              <IonCard
                className="dashboard-card vehicle-card"
                key={vehiculo.id}
              >
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={carOutline} />
                    Vehículo {vehiculo.codigo}
                  </IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <div className="dashboard-info-row">
                    <span>Código</span>
                    <strong>{vehiculo.codigo}</strong>
                  </div>

                  <div className="dashboard-info-row">
                    <span>Capacidad</span>
                    <strong>{vehiculo.capacidad}</strong>
                  </div>

                  <div className="dashboard-info-row">
                    <span>Estado</span>
                    <IonBadge color={obtenerColorEstado(vehiculo.estado)}>
                      {formatearEstado(vehiculo.estado)}
                    </IonBadge>
                  </div>

                  <div className="dashboard-info-row">
                    <span>Última ubicación GPS</span>
                    <strong>
                      {vehiculo.gpsUpdatedAt
                        ? new Date(vehiculo.gpsUpdatedAt).toLocaleString()
                        : 'Sin registro'}
                    </strong>
                  </div>

                  {vehiculo.latitudActual !== null &&
                    vehiculo.longitudActual !== null && (
                      <div className="dashboard-location">
                        <IonIcon icon={locationOutline} />
                        <span>
                          {vehiculo.latitudActual}, {vehiculo.longitudActual}
                        </span>
                      </div>
                    )}
                </IonCardContent>
              </IonCard>
            ))}

            <IonButton
              expand="block"
              fill="outline"
              onClick={() => void cargarPerfil()}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Actualizar información
            </IonButton>
          </>
        )}

        <IonButton
          expand="block"
          color="danger"
          className="dashboard-logout"
          onClick={() => void logout()}
        >
          <IonIcon slot="start" icon={logOutOutline} />
          Cerrar sesión
        </IonButton>

      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
