import { Test, TestingModule } from '@nestjs/testing';
import { RecorridosService } from './recorridos.service';

describe('RecorridosService', () => {
  let service: RecorridosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecorridosService],
    }).compile();

    service = module.get<RecorridosService>(RecorridosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
