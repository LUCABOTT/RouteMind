import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Recorrido } from './models/recorrido.model';
import { UbicacionRecorrido } from '../seguimiento/models/ubicacion-recorrido.model';
import { ParadaRecorrido } from '../seguimiento/models/parada-recorrido.model';
import { RecorridosService } from './recorridos.service';

describe('RecorridosService', () => {
  let service: RecorridosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecorridosService,
        { provide: getModelToken(Recorrido), useValue: {} },
        { provide: getModelToken(UbicacionRecorrido), useValue: {} },
        { provide: getModelToken(ParadaRecorrido), useValue: {} },
      ],
    }).compile();

    service = module.get<RecorridosService>(RecorridosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
