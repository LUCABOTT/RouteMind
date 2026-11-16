import { ConflictException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { Sequelize, Transaction } from 'sequelize-typescript';
import { Pedido } from '../models/pedido.model';
import { Recorrido } from '../../recorridos/models/recorrido.model';
import { Vehiculo } from '../../vehiculos/models/vehiculo.model';
import { PedidosRecorridosService } from './pedidos-recorridos.service';

describe('PedidosRecorridosService', () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
  } as unknown as Transaction;

  const createService = ({
    pedidoModel = {},
    vehiculoModel = {},
    recorridoModel = {},
  }: {
    pedidoModel?: Partial<typeof Pedido>;
    vehiculoModel?: Partial<typeof Vehiculo>;
    recorridoModel?: Partial<typeof Recorrido>;
  } = {}) => {
    const sequelize = {
      transaction: jest.fn((callback) => callback(transaction)),
    } as unknown as Sequelize;

    return {
      service: new PedidosRecorridosService(
        sequelize,
        pedidoModel as typeof Pedido,
        vehiculoModel as typeof Vehiculo,
        recorridoModel as typeof Recorrido,
      ),
      sequelize,
    };
  };

  it('rechaza iniciar otro recorrido cuando ya existe uno activo', async () => {
    const findByPk = jest.fn().mockResolvedValue({
      id: 7,
      estado: 'DISPONIBLE',
    });
    const findOne = jest.fn().mockResolvedValue({ id: 12 });
    const create = jest.fn();
    const { service } = createService({
      vehiculoModel: { findByPk },
      recorridoModel: { findOne, create },
    });

    await expect(service.iniciarRecorrido(7, 5)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(findByPk).toHaveBeenCalledWith(7, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    expect(findOne).toHaveBeenCalledWith({
      where: { vehiculoId: 7, estado: 'EN_CURSO' },
      transaction,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('cierra el recorrido y libera el vehículo al entregar el último pedido', async () => {
    const pedido = {
      estado: 'EN_CAMINO',
      recorridoId: 12,
      update: jest.fn(),
    };
    const recorrido = {
      estado: 'EN_CURSO',
      vehiculoId: 7,
      update: jest.fn(),
    };
    const vehiculo = {
      estado: 'EN_RUTA',
      update: jest.fn(),
    };
    const { service, sequelize } = createService({
      pedidoModel: {
        findByPk: jest.fn().mockResolvedValue(pedido),
        count: jest.fn().mockResolvedValue(0),
      },
      recorridoModel: {
        findByPk: jest.fn().mockResolvedValue(recorrido),
      },
      vehiculoModel: {
        findByPk: jest.fn().mockResolvedValue(vehiculo),
      },
    });

    await service.marcarEntregado(23);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(pedido.update).toHaveBeenCalledWith(
      { estado: 'ENTREGADO' },
      { transaction },
    );
    expect(recorrido.update).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 'COMPLETADO',
        fechaFin: expect.any(Date),
      }),
      { transaction },
    );
    expect(vehiculo.update).toHaveBeenCalledWith(
      { estado: 'DISPONIBLE' },
      { transaction },
    );
  });

  it('mantiene el recorrido activo mientras queden pedidos pendientes', async () => {
    const pedido = {
      estado: 'EN_CAMINO',
      recorridoId: 12,
      update: jest.fn(),
    };
    const recorrido = {
      estado: 'EN_CURSO',
      vehiculoId: 7,
      update: jest.fn(),
    };
    const findVehicle = jest.fn();
    const { service } = createService({
      pedidoModel: {
        findByPk: jest.fn().mockResolvedValue(pedido),
        count: jest.fn().mockResolvedValue(1),
      },
      recorridoModel: {
        findByPk: jest.fn().mockResolvedValue(recorrido),
      },
      vehiculoModel: { findByPk: findVehicle },
    });

    await service.marcarEntregado(23);

    expect(recorrido.update).not.toHaveBeenCalled();
    expect(findVehicle).not.toHaveBeenCalled();
  });
});
