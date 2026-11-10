
import { IonIcon } from '@ionic/react';
import {
  homeOutline,
  mapOutline,
} from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';

import './DriverNavigation.css';

const DriverNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  return (
    <nav className="driver-navigation">
      <button
        className={currentPath === '/dashboard' ? 'active' : ''}
        onClick={() => navigate('/dashboard')}
        type="button"
      >
        <IonIcon icon={homeOutline} />
        <span>Inicio</span>
      </button>

      <button
        className={currentPath.startsWith('/routes') ? 'active' : ''}
        onClick={() => navigate('/routes')}
        type="button"
      >
        <IonIcon icon={mapOutline} />
        <span>Recorridos</span>
      </button>
    </nav>
  );
};

export default DriverNavigation;
