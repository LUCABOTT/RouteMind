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
import { UbicacionRecorrido } from './models/ubicacion-recorrido.model';
import { SeguimientoService } from './seguimiento.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('SeguimientoService', () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
  } as unknown as Transaction;
  const sequelize = {
    transaction: jest.fn((callback) => callback(transaction)),
  } as unknown as Sequelize;
  const userModel = { findByPk: jest.fn() };
  const conductorModel = { findByPk: jest.fn() };
  const vehicleModel = { findOne: jest.fn(), findByPk: jest.fn() };
  const orderModel = { findAll: jest.fn() };
  const routeModel = { findOne: jest.fn() };
  const stopModel = { findAll: jest.fn(), create: jest.fn() };
  const locationModel = { findOne: jest.fn(), create: jest.fn() };
  const realtimeGateway = {
    publishLocationUpdated: jest.fn(),
  };
  const ordersService = { iniciarRecorrido: jest.fn(), marcarEntregado: jest.fn() };
  const service = new SeguimientoService(
    sequelize,
    userModel as unknown as typeof User,
    conductorModel as unknown as typeof Conductor,
    vehicleModel as unknown as typeof Vehiculo,
    orderModel as unknown as typeof Pedido,
    routeModel as unknown as typeof Recorrido,
    stopModel as unknown as typeof ParadaRecorrido,
    locationModel as unknown as typeof UbicacionRecorrido,
    ordersService as unknown as PedidosService,
    realtimeGateway as unknown as RealtimeGateway,
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
    ordersService.iniciarRecorrido.mockResolvedValue({ recorridoId: 12 });
    routeModel.findOne.mockResolvedValue({
      id: 12,
      distanciaRealKm: null,
      update: jest.fn(),
    });
    locationModel.findOne.mockResolvedValue(null);
    locationModel.create.mockResolvedValue({});
    orderModel.findAll.mockResolvedValue([
      { id: 41, latitud: 14.0723, longitud: -87.1921 },
    ]);
    stopModel.findAll.mockResolvedValue([]);
    stopModel.create.mockResolvedValue({});
  });

  it('stores the GPS point and opens a candidate stop for stationary detection', async () => {
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
        pedidoId: null,
        latitud: 14.0723,
        longitud: -87.1921,
        salidaEn: null,
      }),
      { transaction },
    );
    expect(locationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recorridoId: 12,
        latitud: 14.0723,
        longitud: -87.1921,
        precisionM: 10,
        registradoEn: expect.any(Date),
      }),
      { transaction },
    );
    expect(realtimeGateway.publishLocationUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        vehiculoId: 3,
        recorridoId: 12,
        registradoEn: expect.any(Date),
      }),
    );
  });

  it('stores the initial GPS point when a driver starts a route', async () => {
    await service.iniciarRecorrido(5, {
      vehiculoId: 3,
      latitud: 14.0723,
      longitud: -87.1921,
      accuracy: 10,
    });

    expect(locationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recorridoId: 12,
        latitud: 14.0723,
        longitud: -87.1921,
        precisionM: 10,
        registradoEn: expect.any(Date),
      }),
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

  it('accumulates distance and movement time from consecutive GPS points', async () => {
    const updateRoute = jest.fn();
    routeModel.findOne.mockResolvedValue({
      id: 12,
      distanciaRealKm: 0,
      tiempoMovimientoSegundos: 0,
      update: updateRoute,
    });
    locationModel.findOne.mockResolvedValue({
      latitud: 14.0723,
      longitud: -87.1921,
      precisionM: 10,
      registradoEn: new Date(Date.now() - 10_000),
    });

    await service.registrarUbicacion(5, {
      vehiculoId: 3,
      latitud: 14.0733,
      longitud: -87.1921,
      accuracy: 10,
    });

    expect(updateRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        distanciaRealKm: expect.any(Number),
        tiempoMovimientoSegundos: 10,
      }),
      { transaction },
    );
  });

  it('only reports stops that have lasted at least five minutes', async () => {
    vehicleModel.findByPk.mockResolvedValue({
      id: 3,
      codigo: 'V-3',
      latitudActual: 14,
      longitudActual: -87,
      gpsUpdatedAt: new Date(),
      gpsAccuracyM: 10,
    });
    const now = Date.now();
    stopModel.findAll.mockResolvedValue([
      {
        pedidoId: null,
        latitud: 14,
        longitud: -87,
        llegadaEn: new Date(now - 6 * 60 * 1000),
        salidaEn: null,
      },
      {
        pedidoId: null,
        latitud: 15,
        longitud: -88,
        llegadaEn: new Date(now - 2 * 60 * 1000),
        salidaEn: new Date(now),
      },
    ]);

    const result = await service.seguimientoVehiculo(3);

    expect(result.paradas).toHaveLength(1);
    expect(result.paradas[0]).toMatchObject({
      latitud: 14,
      longitud: -87,
      enParada: true,
    });
    expect(result.paradas[0].duracionSegundos).toBeGreaterThanOrEqual(300);
  });

  it('does not count a GPS outage as a stationary stop', async () => {
    const previousPosition = new Date(Date.now() - 4 * 60 * 1000);
    locationModel.findOne.mockResolvedValue({
      latitud: 14.0723,
      longitud: -87.1921,
      precisionM: 10,
      registradoEn: previousPosition,
    });
    const discardCandidate = jest.fn();
    stopModel.findAll.mockResolvedValue([
      {
        latitud: 14.0723,
        longitud: -87.1921,
        llegadaEn: new Date(previousPosition.getTime() - 4 * 60 * 1000),
        update: jest.fn(),
        destroy: discardCandidate,
      },
    ]);

    await service.registrarUbicacion(5, {
      vehiculoId: 3,
      latitud: 14.0723,
      longitud: -87.1921,
      accuracy: 10,
    });

    expect(discardCandidate).toHaveBeenCalledWith({ transaction });
    expect(stopModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ salidaEn: null }),
      { transaction },
    );
  });
});
