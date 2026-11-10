
import { useCallback, useEffect, useState } from 'react';

import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
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
  locationOutline,
  refreshOutline,
  cubeOutline,
  calendarOutline,
} from 'ionicons/icons';

import { useNavigate } from 'react-router-dom';


import { useAuth } from '../../context/useAuth';
import { deliveryService } from '../../Services/deliveries/delivery.service';
import DriverNavigation from '../../components/layout/DriverNavigation';

import type {
  DriverDelivery,
  DeliveryStatus,
} from '../../interfaces/delivery.interface';

import './Deliveries.css';

const Deliveries: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<DriverDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'TODOS' | DeliveryStatus>('TODOS');

  const loadDeliveries = useCallback(async () => {
    if (!session?.token) {
      setError('No se encontró una sesión válida.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await deliveryService.getDeliveries(session.token);
      setDeliveries(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar las entregas.',
      );
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'ENTREGADO':
        return 'success' as const;
      case 'EN_CAMINO':
        return 'primary' as const;
      case 'CANCELADO':
        return 'danger' as const;
      case 'ASIGNADO':
        return 'tertiary' as const;
      default:
        return 'warning' as const;
    }
  };

  const getStatusLabel = (status: DeliveryStatus) => {
    const labels: Record<DeliveryStatus, string> = {
      PENDIENTE: 'Pendiente',
      ASIGNADO: 'Asignado',
      EN_CAMINO: 'En camino',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
    };

    return labels[status];
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    return filter === 'TODOS' || delivery.estado === filter;
  });

  const formatDate = (date?: string) => {
    if (!date) return 'No disponible';

    return new Date(date).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mis entregas</IonTitle>

          <IonButton
            slot="end"
            fill="clear"
            onClick={() => void loadDeliveries()}
            aria-label="Actualizar entregas"
          >
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="deliveries-content">
        <div className="deliveries-container">

          <section className="deliveries-heading">
            <div>
              <h1>Mis entregas</h1>
              <p>Consulta los pedidos asignados a tus vehículos.</p>
            </div>
          </section>

          {!loading && !error && (
            <>
              <div className="deliveries-summary">
                <div>
                  <strong>{deliveries.length}</strong>
                  <span>Total de pedidos</span>
                </div>

                <div>
                  <strong>
                    {deliveries.filter((d) => d.estado === 'ENTREGADO').length}
                  </strong>
                  <span>Entregados</span>
                </div>

                <div>
                  <strong>
                    {deliveries.filter((d) =>
                      ['PENDIENTE', 'ASIGNADO', 'EN_CAMINO'].includes(d.estado),
                    ).length}
                  </strong>
                  <span>Pendientes</span>
                </div>
              </div>

              <div className="deliveries-filters">
                {[
                  'TODOS',
                  'PENDIENTE',
                  'ASIGNADO',
                  'EN_CAMINO',
                  'ENTREGADO',
                  'CANCELADO',
                ].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={filter === status ? 'selected' : ''}
                    onClick={() => setFilter(status as typeof filter)}
                  >
                    {status === 'TODOS'
                      ? 'Todos'
                      : getStatusLabel(status as DeliveryStatus)}
                  </button>
                ))}
              </div>
            </>
          )}

          {loading && (
            <div className="deliveries-feedback">
              <IonSpinner name="crescent" />
              <IonText color="medium">
                <p>Cargando entregas...</p>
              </IonText>
            </div>
          )}

          {!loading && error && (
            <IonCard>
              <IonCardContent>
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>

                <IonButton
                  expand="block"
                  onClick={() => void loadDeliveries()}
                >
                  Intentar nuevamente
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {!loading && !error && filteredDeliveries.length === 0 && (
            <IonCard className="deliveries-empty">
              <IonCardContent>
                <IonIcon icon={cubeOutline} />
                <h2>No hay entregas</h2>
                <p>
                  {deliveries.length === 0
                    ? 'Todavía no tienes pedidos asignados.'
                    : 'No hay pedidos con este estado.'}
                </p>
              </IonCardContent>
            </IonCard>
          )}

          {!loading && !error && filteredDeliveries.length > 0 && (
            <div className="deliveries-list">
              {filteredDeliveries.map((delivery) => (
                <IonCard className="delivery-card" key={delivery.id}>
                  <IonCardContent>
                    <div className="delivery-card-heading">
                      <div>
                        <span className="delivery-reference">
                          Pedido #{delivery.id}
                        </span>

                        <h2>{delivery.destinatario}</h2>
                      </div>

                      <IonBadge color={getStatusColor(delivery.estado)}>
                        {getStatusLabel(delivery.estado)}
                      </IonBadge>
                    </div>

                    <div className="delivery-address">
                      <IonIcon icon={locationOutline} />
                      <span>{delivery.direccion}</span>
                    </div>

                    <div className="delivery-details">
                      <div>
                        <span>Prioridad</span>
                        <strong>{delivery.prioridad}</strong>
                      </div>

                      <div>
                        <span>Vehículo</span>
                        <strong>
                          {delivery.vehiculo?.codigo ?? 'No asignado'}
                        </strong>
                      </div>

                      <div>
                        <span>Recorrido</span>
                        <strong>
                          {delivery.recorrido
                            ? `#${delivery.recorrido.id}`
                            : 'Sin recorrido'}
                        </strong>
                      </div>

                      <div>
                        <span>Fecha de registro</span>
                        <strong>
                          <IonIcon icon={calendarOutline} />
                          {formatDate(delivery.createdAt)}
                        </strong>
                      </div>
                    </div>

                    {delivery.observaciones && (
                      <div className="delivery-observations">
                        <span>Observaciones</span>
                        <p>{delivery.observaciones}</p>
                      </div>
                    )}

                    {Number.isFinite(Number(delivery.latitud)) &&
                      Number.isFinite(Number(delivery.longitud)) && (
                        <div className="delivery-coordinates">
                          Ubicación: {delivery.latitud}, {delivery.longitud}
                        </div>
                      )}

                      <div className="delivery-card-actions">
                    <IonButton
                        expand="block"
                        onClick={() => navigate(`/deliveries/${delivery.id}`)}
                    >
                        Ver detalle
                    </IonButton>
                    </div>
                    </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}
        </div>
      </IonContent>

      <DriverNavigation />
    </IonPage>
  );
};

export default Deliveries;
