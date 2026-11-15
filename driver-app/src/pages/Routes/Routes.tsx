
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
  playCircleOutline,
} from 'ionicons/icons';

import { useAuth } from '../../context/useAuth';
import { routeService } from '../../Services/routes/route.service';

import type {
  DriverRoute,
  DriverAssignedVehicle,
} from '../../interfaces/route.interface';

import DriverNavigation from '../../components/layout/DriverNavigation';
import { useDriverGPS } from '../../hooks/useDriveGPS';

import './Routes.css';

const Routes = () => {
  const { session } = useAuth();

  // Recorridos del conductor.
  const [routes, setRoutes] = useState<DriverRoute[]>([]);

  // Vehículos asignados al conductor.
  const [vehicles, setVehicles] = useState<DriverAssignedVehicle[]>([]);

  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  const [startingVehicleId, setStartingVehicleId] =
    useState<number | null>(null);

  const [startError, setStartError] = useState<string | null>(null);

  // Hook GPS: no solicita permisos ni inicia seguimiento automáticamente.
  const gps = useDriverGPS(session?.token);

  // Identificar si existe un recorrido activo.
  const activeRoute = routes.find(
    (route) => route.estado === 'EN_CURSO',
  );

  // --------------------------------------------------
  // CARGAR RECORRIDOS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // CARGAR VEHÍCULOS ASIGNADOS
  // --------------------------------------------------

  const loadMyVehicles = useCallback(async () => {
    if (!session?.token) {
      setVehiclesError('No se encontró una sesión válida.');
      setVehiclesLoading(false);
      return;
    }

    try {
      setVehiclesLoading(true);
      setVehiclesError(null);

      const data = await routeService.getMyVehicles(session.token);

      setVehicles(data);
    } catch (err) {
      setVehiclesError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar tus vehículos asignados.',
      );
    } finally {
      setVehiclesLoading(false);
    }
  }, [session?.token]);

  // --------------------------------------------------
  // ACTUALIZAR TODA LA PANTALLA
  // --------------------------------------------------

  const refreshData = useCallback(async () => {
    await Promise.all([
      loadRoutes(),
      loadMyVehicles(),
    ]);
  }, [loadRoutes, loadMyVehicles]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  // --------------------------------------------------
  // INICIAR RECORRIDO
  // --------------------------------------------------

  const handleStartRoute = async (vehicleId: number) => {
    if (!session?.token || startingVehicleId !== null) {
      return;
    }

    try {
      setStartingVehicleId(vehicleId);
      setStartError(null);

      // El hook se encarga de:
      // 1. Solicitar permiso GPS.
      // 2. Obtener la posición actual.
      // 3. Crear el recorrido en el backend.
      // 4. Activar el seguimiento GPS.
      await gps.startRoute(vehicleId);

      // Actualizar información después de confirmar el inicio.
      await refreshData();

    } catch (err) {
      setStartError(
        err instanceof Error
          ? err.message
          : 'No fue posible iniciar el recorrido.',
      );
    } finally {
      setStartingVehicleId(null);
    }
  };

  const handleActivateGPS = async (vehicleId: number) => {
    setStartError(null);

    try {
      await gps.activateTracking(vehicleId);
    } catch (err) {
      setStartError(
        err instanceof Error
          ? err.message
          : 'No fue posible activar el seguimiento GPS.',
      );
    }
  };

  // --------------------------------------------------
  // FORMATEAR FECHAS
  // --------------------------------------------------

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-HN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // --------------------------------------------------
  // FORMATEAR DISTANCIAS
  // --------------------------------------------------

  const formatDistance = (distance: number | null) => {
    if (distance === null || distance === undefined) {
      return 'No disponible';
    }

    return `${Number(distance).toFixed(2)} km`;
  };

  // --------------------------------------------------
  // ESTADO DEL RECORRIDO
  // --------------------------------------------------

  const getRouteStatus = (status: DriverRoute['estado']) => {
    if (status === 'EN_CURSO') {
      return {
        label: 'En curso',
        color: 'success' as const,
      };
    }

    return {
      label: 'Completado',
      color: 'medium' as const,
    };
  };

  // --------------------------------------------------
  // ESTADO DEL PEDIDO
  // --------------------------------------------------

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

  // --------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mis recorridos</IonTitle>

          <IonButton
            slot="end"
            fill="clear"
            onClick={() => void refreshData()}
            aria-label="Actualizar información"
            disabled={loading || vehiclesLoading}
          >
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="routes-content">
        <div className="routes-container">

          {/* ENCABEZADO */}

          <div className="routes-heading">
            <div>
              <h1>Mis recorridos</h1>
              <p>
                Consulta tus recorridos y pedidos asignados para hoy.
              </p>
            </div>

            <IonButton routerLink="/driver/map">
  <IonIcon icon={mapOutline} slot="start" />
  Ver mapa de entregas
</IonButton>

            <IonButton
              fill="outline"
              size="small"
              onClick={() => void refreshData()}
              disabled={loading || vehiclesLoading}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Actualizar
            </IonButton>
          </div>

          {/* ERROR AL INICIAR RECORRIDO */}

          {startError && (
            <IonCard className="routes-error-card">
              <IonCardContent>
                <IonText color="danger">
                  <p>{startError}</p>
                </IonText>
              </IonCardContent>
            </IonCard>
          )}

          {/* VEHÍCULOS ASIGNADOS */}

          <section className="assigned-vehicles-section">
            <div className="routes-section-heading">
              <h2>Mis vehículos asignados</h2>
              <p>
                Selecciona un vehículo para iniciar tu recorrido.
              </p>
            </div>

            {vehiclesLoading && (
              <div className="routes-feedback">
                <IonSpinner name="crescent" />

                <IonText color="medium">
                  <p>Cargando vehículos asignados...</p>
                </IonText>
              </div>
            )}

            {!vehiclesLoading && vehiclesError && (
              <IonCard className="routes-error-card">
                <IonCardContent>
                  <IonText color="danger">
                    <p>{vehiclesError}</p>
                  </IonText>

                  <IonButton
                    fill="outline"
                    onClick={() => void loadMyVehicles()}
                  >
                    Intentar nuevamente
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}

            {!vehiclesLoading &&
              !vehiclesError &&
              vehicles.length === 0 && (
                <IonCard className="routes-empty-card">
                  <IonCardContent>
                    <IonIcon
                      icon={carOutline}
                      className="routes-empty-icon"
                    />

                    <h2>No tienes vehículos asignados</h2>

                    <p>
                      Cuando el administrador te asigne un vehículo,
                      aparecerá aquí.
                    </p>
                  </IonCardContent>
                </IonCard>
              )}

            {!vehiclesLoading &&
              !vehiclesError &&
              vehicles.map((vehicle) => {
                const hasActiveRoute =
                  vehicle.recorridoEstado === 'EN_CURSO';

                const hasAssignedOrders =
                  vehicle.pedidos.some(
                    (pedido) => pedido.estado === 'ASIGNADO',
                  );

                const isAvailable =
                  vehicle.estado === 'DISPONIBLE';

                const canStart =
                  isAvailable &&
                  !hasActiveRoute &&
                  hasAssignedOrders;

                const isStarting =
                  startingVehicleId === vehicle.id;

                const isTrackingThisVehicle =
                  gps.trackingVehicleId === vehicle.id;

                return (
                  <IonCard
                    className="assigned-vehicle-card"
                    key={vehicle.id}
                  >
                    <IonCardHeader>
                      <div className="route-card-heading">
                        <div>
                          <IonCardTitle>
                            <IonIcon icon={carOutline} />
                            {' '}
                            {vehicle.codigo}
                          </IonCardTitle>

                          <p className="route-date">
                            Vehículo #{vehicle.id}
                          </p>
                        </div>

                        <IonBadge
                          color={
                            hasActiveRoute
                              ? 'success'
                              : isAvailable
                                ? 'primary'
                                : 'medium'
                          }
                        >
                          {hasActiveRoute
                            ? 'En recorrido'
                            : vehicle.estado}
                        </IonBadge>
                      </div>
                    </IonCardHeader>

                    <IonCardContent>

                      {/* PEDIDOS ASIGNADOS */}

                      <div className="route-deliveries">
                        <h3>
                          Pedidos ({vehicle.pedidos.length})
                        </h3>

                        {vehicle.pedidos.length === 0 ? (
                          <p className="route-no-deliveries">
                            No hay pedidos asignados a este vehículo.
                          </p>
                        ) : (
                          vehicle.pedidos.map((pedido) => (
                            <div
                              className="route-delivery"
                              key={pedido.id}
                            >
                              <div className="route-delivery-main">
                                <strong>
                                  Pedido #{pedido.id} — {pedido.destinatario}
                                </strong>

                                <span>{pedido.direccion}</span>

                                <span>
                                  Estado: {getDeliveryStatus(pedido.estado)}
                                </span>
                              </div>

                              <IonBadge
                                color={
                                  pedido.estado === 'ENTREGADO'
                                    ? 'success'
                                    : pedido.estado === 'CANCELADO'
                                      ? 'danger'
                                      : 'warning'
                                }
                              >
                                {getDeliveryStatus(pedido.estado)}
                              </IonBadge>
                            </div>
                          ))
                        )}
                      </div>

                      {/* BOTÓN INICIAR RECORRIDO */}

                      {canStart && (
                        <IonButton
                          expand="block"
                          className="start-route-button"
                          onClick={() => handleStartRoute(vehicle.id)}
                          disabled={
                            startingVehicleId !== null ||
                            gps.trackingVehicleId !== null
                          }
                        >
                          {isStarting ? (
                            <>
                              <IonSpinner name="crescent" />
                              {' '}Iniciando recorrido...
                            </>
                          ) : (
                            <>
                              <IonIcon
                                slot="start"
                                icon={playCircleOutline}
                              />
                              Iniciar recorrido
                            </>
                          )}
                        </IonButton>
                      )}

                      {/* RECORRIDO ACTIVO */}

                      {hasActiveRoute && (
                        <IonText color="success">
                          <p>
                            Este vehículo tiene un recorrido activo.
                          </p>
                        </IonText>
                      )}

                      {/* GPS ACTIVO */}

                      {isTrackingThisVehicle && (
                        <IonBadge color="success">
                          Seguimiento GPS activo
                        </IonBadge>
                      )}

                      {/* SIN PEDIDOS */}

                      {!hasActiveRoute &&
                        !hasAssignedOrders &&
                        isAvailable && (
                          <IonText color="medium">
                            <p>
                              Necesitas tener al menos un pedido asignado
                              para iniciar un recorrido.
                            </p>
                          </IonText>
                        )}

                    </IonCardContent>
                  </IonCard>
                );
              })}
          </section>

          {/* HISTORIAL DE RECORRIDOS */}

          <section className="routes-history-section">
            <div className="routes-section-heading">
              <h2>Historial de recorridos</h2>
              <p>
                Consulta el estado y los detalles de tus recorridos.
              </p>
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
                  <IonIcon
                    icon={mapOutline}
                    className="routes-empty-icon"
                  />

                  <h2>No tienes recorridos hoy</h2>

                  <p>
                    Cuando inicies un recorrido, aparecerá aquí.
                  </p>
                </IonCardContent>
              </IonCard>
            )}

            {!loading && !error && routes.length > 0 && (
              <div className="routes-list">

                {/* RESUMEN */}

                <div className="routes-summary">
                  <strong>{routes.length}</strong>

                  <span>
                    {routes.length === 1
                      ? 'recorrido encontrado'
                      : 'recorridos encontrados'}
                  </span>
                </div>

                {/* ESTADO GPS */}

                {activeRoute && (
                  <IonCard className="route-gps-card">
                    <IonCardContent>
                      <div className="route-gps-header">
                        <IonIcon icon={mapOutline} />

                        <strong>Seguimiento GPS</strong>

                        <IonBadge
                          color={
                            gps.status === 'TRACKING'
                              ? 'success'
                              : gps.status === 'ERROR'
                                ? 'danger'
                                : gps.status === 'REQUESTING'
                                  ? 'warning'
                                  : 'medium'
                          }
                        >
                          {gps.status === 'TRACKING'
                            ? 'Activo'
                            : gps.status === 'REQUESTING'
                              ? 'Solicitando ubicación'
                              : gps.status === 'ERROR'
                                ? 'Error'
                                : 'Inactivo'}
                        </IonBadge>
                      </div>

                      {gps.error && (
                        gps.error !== startError && (
                          <IonText color="danger">
                            <p>{gps.error}</p>
                          </IonText>
                        )
                      )}

                      {gps.lastUpdate && (
                        <IonText color="medium">
                          <p>
                            Última actualización:{' '}
                            {gps.lastUpdate.toLocaleTimeString('es-HN')}
                          </p>
                        </IonText>
                      )}

                      <p>
                        Vehículo:{' '}
                        <strong>
                          {activeRoute.vehiculo?.codigo}
                        </strong>
                      </p>

                      {gps.trackingVehicleId ===
                      activeRoute.vehiculoId ? (
                        <IonBadge color="success">
                          Seguimiento GPS activo
                        </IonBadge>
                      ) : (
                        <IonButton
                          expand="block"
                          onClick={() =>
                            void handleActivateGPS(
                              activeRoute.vehiculoId,
                            )
                          }
                          disabled={
                            gps.status === 'REQUESTING' ||
                            gps.trackingVehicleId !== null
                          }
                        >
                          {gps.status === 'REQUESTING' ? (
                            <>
                              <IonSpinner name="crescent" />
                              {' '}Activando ubicación GPS...
                            </>
                          ) : (
                            <>
                              <IonIcon
                                slot="start"
                                icon={mapOutline}
                              />
                              Activar ubicación GPS
                            </>
                          )}
                        </IonButton>
                      )}
                    </IonCardContent>
                  </IonCard>
                )}

                {/* TARJETAS DE RECORRIDOS */}

                {routes.map((route) => {
                  const status = getRouteStatus(route.estado);

                  return (
                    <IonCard
                      className="route-card"
                      key={route.id}
                    >
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

                        {/* INFORMACIÓN DEL RECORRIDO */}

                        <div className="route-info-grid">

                          <div className="route-info-item">
                            <IonIcon icon={carOutline} />

                            <div>
                              <span>Vehículo</span>

                              <strong>
                                {route.vehiculo?.codigo ?? 'No asignado'}
                              </strong>
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

                        {/* FECHA DE FINALIZACIÓN */}

                        {route.fechaFin && (
                          <p className="route-finish-date">
                            Finalizado: {formatDate(route.fechaFin)}
                          </p>
                        )}

                        {/* PEDIDOS DEL RECORRIDO */}

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
                                    Pedido #{delivery.id} —{' '}
                                    {delivery.destinatario}
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
          </section>

        </div>
      </IonContent>

      <DriverNavigation />
    </IonPage>
  );
};

export default Routes;
