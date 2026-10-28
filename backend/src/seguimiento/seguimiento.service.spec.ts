import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Sequelize, Transaction } from 'sequelize-typescript';
import { User } from '../auth/models/user.model';
import { Pedido } from '../pedidos/models/pedido.model';
import { PedidosService } from '../pedidos/pedidos.service';
import { Recorrido } from '../recorridos/models/recorrido.model';
import { Conductor } from '../vehiculos/models/conductor.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { ParadaRecorrido } from './models/parada-recorrido.model';
import { SeguimientoService } from './seguimiento.service';

describe('SeguimientoService', () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
  } as unknown as Transaction;
  const sequelize = {
    transaction: jest.fn((callback) => callback(transaction)),
  } as unknown as Sequelize;
  const userModel = { findByPk: jest.fn() };
  const conductorModel = { findByPk: jest.fn() };
  const vehicleModel = { findOne: jest.fn() };
  const orderModel = { findAll: jest.fn() };
  const routeModel = { findOne: jest.fn() };
  const stopModel = { findAll: jest.fn(), create: jest.fn() };
  const ordersService = { iniciarRecorrido: jest.fn(), marcarEntregado: jest.fn() };
  const service = new SeguimientoService(
    sequelize,
    userModel as unknown as typeof User,
    conductorModel as unknown as typeof Conductor,
    vehicleModel as unknown as typeof Vehiculo,
    orderModel as unknown as typeof Pedido,
    routeModel as unknown as typeof Recorrido,
    stopModel as unknown as typeof ParadaRecorrido,
    ordersService as unknown as PedidosService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    userModel.findByPk.mockResolvedValue({ conductorId: 8 });
    conductorModel.findByPk.mockResolvedValue({ id: 8, activo: true });
    vehicleModel.findOne.mockResolvedValue({
      id: 3,
      latitudActual: null,
      longitudActual: null,
      gpsUpdatedAt: null,
      gpsAccuracyM: null,
      update: jest.fn(),
    });
    routeModel.findOne.mockResolvedValue({
      id: 12,
      distanciaRealKm: null,
      update: jest.fn(),
    });
    orderModel.findAll.mockResolvedValue([
      { id: 41, latitud: 14.0723, longitud: -87.1921 },
    ]);
    stopModel.findAll.mockResolvedValue([]);
    stopModel.create.mockResolvedValue({});
  });

  it('saves GPS position and opens a stop when the driver enters its geofence', async () => {
    await expect(
      service.registrarUbicacion(5, {
        vehiculoId: 3,
        latitud: 14.0723,
        longitud: -87.1921,
        accuracy: 10,
      }),
    ).resolves.toMatchObject({ recibido: true });

    expect(vehicleModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3, conductorId: 8 },
        lock: 'UPDATE',
      }),
    );
    expect(stopModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recorridoId: 12,
        pedidoId: 41,
        salidaEn: null,
      }),
      { transaction },
    );
  });

  it('rejects a vehicle not assigned to the authenticated driver', async () => {
    vehicleModel.findOne.mockResolvedValue(null);

    await expect(
      service.registrarUbicacion(5, {
        vehiculoId: 99,
        latitud: 14,
        longitud: -87,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(routeModel.findOne).not.toHaveBeenCalled();
  });
});
