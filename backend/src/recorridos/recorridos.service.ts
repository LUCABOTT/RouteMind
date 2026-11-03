
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Recorrido } from './models/recorrido.model';
import { Pedido } from '../pedidos/models/pedido.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { Conductor } from '../vehiculos/models/conductor.model';

@Injectable()
export class RecorridosService {
  constructor(
    @InjectModel(Recorrido)
    private readonly recorridoModel: typeof Recorrido,
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
    return recorrido ? this.serializar(recorrido) : null;
  }

  private serializar(recorrido: Recorrido) {
    const data = recorrido.toJSON() as Record<string, any>;
    if (data.vehiculo) {
      data.vehiculo.conductor = data.vehiculo.conductorInfo?.nombre ?? null;
    }
    return data;
  }
}
