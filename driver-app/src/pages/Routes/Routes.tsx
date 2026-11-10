
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
  calendarOutline,
  carOutline,
  refreshOutline,
  mapOutline,
  cubeOutline,
} from 'ionicons/icons';

import { useAuth } from '../../context/useAuth';
import { routeService } from '../../Services/routes/route.service';
import type { DriverRoute } from '../../interfaces/route.interface';
import DriverNavigation from '../../components/layout/DriverNavigation';

import './Routes.css';

const Routes = () => {
  const { session } = useAuth();

  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    if (!session?.token) {
      setError('No se encontró una sesión válida.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await routeService.getTodayRoutes(session.token);
      setRoutes(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar tus recorridos.',
      );
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-HN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatDistance = (distance: number | null) => {
    if (distance === null || distance === undefined) {
      return 'No disponible';
    }

    return `${Number(distance).toFixed(2)} km`;
  };

  const getRouteStatus = (status: DriverRoute['estado']) => {
    if (status === 'EN_CURSO') {
      return { label: 'En curso', color: 'success' as const };
    }

    return { label: 'Completado', color: 'medium' as const };
  };

  const getDeliveryStatus = (status: string) => {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      ASIGNADO: 'Asignado',
      EN_CAMINO: 'En camino',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
    };

    return labels[status] ?? status;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mis recorridos</IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={() => void loadRoutes()}
            aria-label="Actualizar recorridos"
          >
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="routes-content">
        <div className="routes-container">
          <div className="routes-heading">
            <div>
              <h1>Mis recorridos</h1>
              <p>Consulta tus recorridos y pedidos asignados para hoy.</p>
            </div>
            <IonButton
              fill="outline"
              size="small"
              onClick={() => void loadRoutes()}
              disabled={loading}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Actualizar
            </IonButton>
          </div>

          {loading && (
            <div className="routes-feedback">
              <IonSpinner name="crescent" />
              <IonText color="medium">
                <p>Cargando tus recorridos...</p>
              </IonText>
            </div>
          )}

          {!loading && error && (
            <IonCard className="routes-error-card">
              <IonCardContent>
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
                <IonButton onClick={() => void loadRoutes()}>
                  Intentar nuevamente
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {!loading && !error && routes.length === 0 && (
            <IonCard className="routes-empty-card">
              <IonCardContent>
                <IonIcon icon={mapOutline} className="routes-empty-icon" />
                <h2>No tienes recorridos hoy</h2>
                <p>
                  Cuando el planificador te asigne un recorrido, aparecerá
                  aquí.
                </p>
              </IonCardContent>
            </IonCard>
          )}

          {!loading && !error && routes.length > 0 && (
            <div className="routes-list">
              <div className="routes-summary">
                <strong>{routes.length}</strong>
                <span>
                  {routes.length === 1
                    ? 'recorrido encontrado'
                    : 'recorridos encontrados'}
                </span>
              </div>

              {routes.map((route) => {
                const status = getRouteStatus(route.estado);

                return (
                  <IonCard className="route-card" key={route.id}>
                    <IonCardHeader>
                      <div className="route-card-heading">
                        <div>
                          <IonCardTitle>
                            Recorrido #{route.id}
                          </IonCardTitle>
                          <p className="route-date">
                            <IonIcon icon={calendarOutline} />
                            {formatDate(route.fechaInicio)}
                          </p>
                        </div>

                        <IonBadge color={status.color}>
                          {status.label}
                        </IonBadge>
                      </div>
                    </IonCardHeader>

                    <IonCardContent>
                      <div className="route-info-grid">
                        <div className="route-info-item">
                          <IonIcon icon={carOutline} />
                          <div>
                            <span>Vehículo</span>
                            <strong>{route.vehiculo?.codigo ?? 'No asignado'}</strong>
                          </div>
                        </div>

                        <div className="route-info-item">
                          <IonIcon icon={cubeOutline} />
                          <div>
                            <span>Pedidos</span>
                            <strong>{route.totalPedidos}</strong>
                          </div>
                        </div>

                        <div className="route-info-item">
                          <IonIcon icon={mapOutline} />
                          <div>
                            <span>Distancia estimada</span>
                            <strong>
                              {formatDistance(route.distanciaEstimadaKm)}
                            </strong>
                          </div>
                        </div>

                        <div className="route-info-item">
                          <IonIcon icon={mapOutline} />
                          <div>
                            <span>Distancia real</span>
                            <strong>
                              {formatDistance(route.distanciaRealKm)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {route.fechaFin && (
                        <p className="route-finish-date">
                          Finalizado: {formatDate(route.fechaFin)}
                        </p>
                      )}

                      <div className="route-deliveries">
                        <h3>Pedidos del recorrido</h3>

                        {route.pedidos.length === 0 ? (
                          <p className="route-no-deliveries">
                            Este recorrido no tiene pedidos registrados.
                          </p>
                        ) : (
                          route.pedidos.map((delivery) => (
                            <div
                              className="route-delivery"
                              key={delivery.id}
                            >
                              <div className="route-delivery-main">
                                <strong>
                                  Pedido #{delivery.id} — {delivery.destinatario}
                                </strong>
                                <span>{delivery.direccion}</span>
                                <span>
                                  Prioridad: {delivery.prioridad}
                                </span>
                              </div>

                              <IonBadge
                                color={
                                  delivery.estado === 'ENTREGADO'
                                    ? 'success'
                                    : delivery.estado === 'CANCELADO'
                                      ? 'danger'
                                      : 'warning'
                                }
                              >
                                {getDeliveryStatus(delivery.estado)}
                              </IonBadge>
                            </div>
                          ))
                        )}
                      </div>
                    </IonCardContent>
                  </IonCard>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>
      <DriverNavigation />
    </IonPage>
  );
};

export default Routes;
