import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from './pedidos.service';
import { PedidosCrudService } from './services/pedidos-crud.service';
import { PedidosRecorridosService } from './services/pedidos-recorridos.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('PedidosService', () => {
  let service: PedidosService;
  const realtimeGateway = { publishRouteUpdated: jest.fn() };
  const pedidosRecorridosService = {
    marcarEntregado: jest.fn(),
    iniciarRecorrido: jest.fn(),
  };
  const pedidosCrudService = {
    crear: jest.fn(),
    actualizar: jest.fn(),
    buscarPorId: jest.fn(),
    eliminar: jest.fn(),
    asignar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        {
          provide: PedidosCrudService,
          useValue: pedidosCrudService,
        },
        {
          provide: PedidosRecorridosService,
          useValue: pedidosRecorridosService,
        },
        {
          provide: RealtimeGateway,
          useValue: realtimeGateway,
        },
      ],
    }).compile();

    service = module.get<PedidosService>(PedidosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('publishes a route update after a delivery is saved', async () => {
    const deliveredOrder = {
      id: 21,
      vehiculoId: 7,
      recorridoId: 12,
    };
    pedidosRecorridosService.marcarEntregado.mockResolvedValue(
      deliveredOrder,
    );

    await expect(service.marcarEntregado(21)).resolves.toBe(deliveredOrder);

    expect(realtimeGateway.publishRouteUpdated).toHaveBeenCalledWith({
      vehiculoId: 7,
      recorridoId: 12,
      pedidoId: 21,
    });
  });
});
