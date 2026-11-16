import { Test, TestingModule } from '@nestjs/testing';
import { RecorridosController } from './recorridos.controller';

describe('RecorridosController', () => {
  let controller: RecorridosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecorridosController],
    }).compile();

    controller = module.get<RecorridosController>(RecorridosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
