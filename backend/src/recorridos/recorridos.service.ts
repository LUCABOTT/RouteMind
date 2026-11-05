
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Recorrido } from './models/recorrido.model';
import { Pedido } from '../pedidos/models/pedido.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { Conductor } from '../vehiculos/models/conductor.model';
import { ParadaRecorrido } from '../seguimiento/models/parada-recorrido.model';
import { UbicacionRecorrido } from '../seguimiento/models/ubicacion-recorrido.model';

@Injectable()
export class RecorridosService {
  constructor(
    @InjectModel(Recorrido)
    private readonly recorridoModel: typeof Recorrido,
    @InjectModel(UbicacionRecorrido)
    private readonly ubicacionModel: typeof UbicacionRecorrido,
    @InjectModel(ParadaRecorrido)
    private readonly paradaModel: typeof ParadaRecorrido,
  ) {}

  async listar() {
    const recorridos = await this.recorridoModel.findAll({
      include: [
        {
          model: Vehiculo,
          attributes: ['id', 'codigo'],
          include: [
            {
              model: Conductor,
              as: 'conductorInfo',
              attributes: ['id', 'nombre'],
            },
          ],
        },
        {
          model: Pedido,
          attributes: [
            'id',
            'destinatario',
            'direccion',
            'latitud',
            'longitud',
            'estado',
            'prioridad',
          ],
        },
      ],
      order: [['fechaInicio', 'DESC']],
    });
    return recorridos.map((recorrido) => this.serializar(recorrido));
  }

  async buscarPorId(id: number) {
    const recorrido = await this.recorridoModel.findByPk(id, {
      include: [
        {
          model: Vehiculo,
          attributes: ['id', 'codigo'],
          include: [
            {
              model: Conductor,
              as: 'conductorInfo',
              attributes: ['id', 'nombre'],
            },
          ],
        },
        {
          model: Pedido,
          attributes: [
            'id',
            'destinatario',
            'direccion',
            'latitud',
            'longitud',
            'estado',
            'prioridad',
          ],
        },
      ],
    });
    if (!recorrido) return null;

    const [ubicacionesGps, paradas] = await Promise.all([
      this.ubicacionModel.findAll({
        where: { recorridoId: recorrido.id },
        order: [['registradoEn', 'ASC']],
      }),
      this.paradaModel.findAll({
        where: { recorridoId: recorrido.id },
        order: [['llegadaEn', 'ASC']],
      }),
    ]);
    return this.serializar(recorrido, ubicacionesGps, paradas);
  }

  private serializar(
    recorrido: Recorrido,
    ubicacionesGps?: UbicacionRecorrido[],
    paradas?: ParadaRecorrido[],
  ) {
    const data = recorrido.toJSON() as Record<string, any>;
    if (data.vehiculo) {
      data.vehiculo.conductor = data.vehiculo.conductorInfo?.nombre ?? null;
    }
    if (ubicacionesGps) {
      data.ubicacionesGps = ubicacionesGps.map((ubicacion) => ({
        latitud: Number(ubicacion.latitud),
        longitud: Number(ubicacion.longitud),
        precisionM: ubicacion.precisionM,
        registradoEn: ubicacion.registradoEn,
      }));
    }
    if (paradas) {
      const pedidosPorId = new Map<
        number,
        Record<string, any>
      >(
        (data.pedidos ?? []).map(
          (pedido: Record<string, any>): [number, Record<string, any>] => [
            Number(pedido.id),
            pedido,
          ],
        ),
      );
      const ahora = Date.now();
      data.paradas = paradas.map((parada) => {
        const pedido =
          parada.pedidoId == null
            ? undefined
            : pedidosPorId.get(parada.pedidoId);
        const duracionSegundos = Math.max(
          0,
          Math.round(
            ((parada.salidaEn?.getTime() ?? ahora) -
              parada.llegadaEn.getTime()) /
              1000,
          ),
        );
        return {
          pedidoId: parada.pedidoId,
          destinatario: pedido?.destinatario ?? 'Parada',
          latitud: parada.latitud ?? pedido?.latitud ?? null,
          longitud: parada.longitud ?? pedido?.longitud ?? null,
          llegadaEn: parada.llegadaEn,
          salidaEn: parada.salidaEn,
          duracionSegundos,
          enParada: parada.salidaEn == null,
        };
      }).filter(
        (parada) => parada.duracionSegundos >= 5 * 60,
      );
    }
    return data;
  }
}
