import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from './pedidos.service';
import { PedidosCrudService } from './services/pedidos-crud.service';
import { PedidosRecorridosService } from './services/pedidos-recorridos.service';

describe('PedidosService', () => {
  let service: PedidosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        {
          provide: PedidosCrudService,
          useValue: {},
        },
        {
          provide: PedidosRecorridosService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PedidosService>(PedidosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
