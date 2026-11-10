
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
  arrowBackOutline,
  locationOutline,
  navigateOutline,
} from 'ionicons/icons';

import { useAuth } from '../../context/useAuth';
import { deliveryService } from '../../Services/deliveries/delivery.service';

import type {
  DriverDelivery,
  DeliveryStatus,
} from '../../interfaces/delivery.interface';

import './DeliveryDetail.css';

const DeliveryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [delivery, setDelivery] = useState<DriverDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadDelivery = async () => {
      if (!session?.token) {
        setError('No se encontró una sesión válida.');
        setLoading(false);
        return;
      }

      const deliveryId = Number(id);

      if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
        setError('El identificador del pedido no es válido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await deliveryService.getDeliveryById(
          deliveryId,
          session.token,
        );

        if (active) {
          setDelivery(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'No fue posible cargar el pedido.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDelivery();

    return () => {
      active = false;
    };
  }, [id, session?.token]);

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

  const mapsUrl = delivery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${delivery.latitud},${delivery.longitud}`,
      )}`
    : '';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton
            slot="start"
            fill="clear"
            onClick={() => navigate('/deliveries')}
            aria-label="Volver a entregas"
          >
            <IonIcon icon={arrowBackOutline} />
          </IonButton>

          <IonTitle>Detalle del pedido</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="delivery-detail-content">
        <div className="delivery-detail-container">
          {loading && (
            <div className="delivery-detail-feedback">
              <IonSpinner name="crescent" />
              <p>Cargando información del pedido...</p>
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
                  onClick={() => navigate('/deliveries')}
                >
                  Volver a mis entregas
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {!loading && !error && delivery && (
            <>
              <section className="delivery-detail-heading">
                <span>Pedido #{delivery.id}</span>
                <h1>{delivery.destinatario}</h1>

                <IonBadge color={getStatusColor(delivery.estado)}>
                  {getStatusLabel(delivery.estado)}
                </IonBadge>
              </section>

              <IonCard>
                <IonCardContent>
                  <h2>Información de entrega</h2>

                  <div className="delivery-detail-item">
                    <IonIcon icon={locationOutline} />
                    <div>
                      <span>Dirección</span>
                      <strong>{delivery.direccion}</strong>
                    </div>
                  </div>

                  <div className="delivery-detail-item">
                    <div>
                      <span>Prioridad</span>
                      <strong>{delivery.prioridad}</strong>
                    </div>
                  </div>

                  <div className="delivery-detail-item">
                    <div>
                      <span>Vehículo asignado</span>
                      <strong>
                        {delivery.vehiculo?.codigo ?? 'No asignado'}
                      </strong>
                    </div>
                  </div>

                  <div className="delivery-detail-item">
                    <div>
                      <span>Recorrido</span>
                      <strong>
                        {delivery.recorrido
                          ? `#${delivery.recorrido.id}`
                          : 'Sin recorrido'}
                      </strong>
                    </div>
                  </div>

                  {delivery.observaciones && (
                    <div className="delivery-detail-observations">
                      <span>Observaciones</span>
                      <p>{delivery.observaciones}</p>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>

              <IonCard>
                <IonCardContent>
                  <h2>Ubicación del destinatario</h2>

                  <p>
                    Latitud: {delivery.latitud}
                    <br />
                    Longitud: {delivery.longitud}
                  </p>

                  <IonButton
                    expand="block"
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IonIcon
                      slot="start"
                      icon={navigateOutline}
                    />
                    Abrir ubicación en Google Maps
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DeliveryDetail;
