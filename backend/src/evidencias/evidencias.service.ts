
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { EvidenciaEntrega } from './models/evidencia-entrega.model';
import { Pedido } from '../pedidos/models/pedido.model';
import { Recorrido } from '../recorridos/models/recorrido.model';
import { ParadaRecorrido } from '../seguimiento/models/parada-recorrido.model';
import { Conductor } from '../vehiculos/models/conductor.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';

import { CloudinaryService } from '../storage/cloudinary.service';
import { CrearEvidenciaDto } from './dto/crear-evidencias.dto';

@Injectable()
export class EvidenciasService {
  constructor(
    @InjectModel(EvidenciaEntrega)
    private readonly evidenciaModel: typeof EvidenciaEntrega,

    @InjectModel(Pedido)
    private readonly pedidoModel: typeof Pedido,

    @InjectModel(Recorrido)
    private readonly recorridoModel: typeof Recorrido,

    @InjectModel(ParadaRecorrido)
    private readonly paradaModel: typeof ParadaRecorrido,

    @InjectModel(Conductor)
    private readonly conductorModel: typeof Conductor,

    @InjectModel(Vehiculo)
    private readonly vehiculoModel: typeof Vehiculo,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async crearEvidencia(
    dto: CrearEvidenciaDto,
    file: Express.Multer.File,
    usuario: {
      id: number;
      role: string;
      conductorId: number | null;
    },
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException(
        'Debes adjuntar una fotografía de la entrega',
      );
    }

    if (usuario.role !== 'CONDUCTOR') {
      throw new ForbiddenException(
        'Solo un conductor puede registrar evidencias de entrega',
      );
    }

    if (!usuario.conductorId) {
      throw new ForbiddenException(
        'El usuario no tiene un conductor asociado',
      );
    }

    const pedidoId = this.validarId(dto.pedidoId, 'pedidoId');
    const recorridoId = this.validarId(dto.recorridoId, 'recorridoId');
    const paradaRecorridoId = this.validarId(
      dto.paradaRecorridoId,
      'paradaRecorridoId',
    );

    const pedido = await this.pedidoModel.findByPk(pedidoId);

    if (!pedido) {
      throw new NotFoundException('El pedido no existe');
    }

    const recorrido = await this.recorridoModel.findByPk(recorridoId);

    if (!recorrido) {
      throw new NotFoundException('El recorrido no existe');
    }

    const parada = await this.paradaModel.findByPk(paradaRecorridoId);

    if (!parada) {
      throw new NotFoundException('La parada del recorrido no existe');
    }

    if (Number(pedido.recorridoId) !== recorridoId) {
      throw new BadRequestException(
        'El pedido no pertenece al recorrido indicado',
      );
    }

    if (Number(parada.recorridoId) !== recorridoId) {
      throw new BadRequestException(
        'La parada no pertenece al recorrido indicado',
      );
    }

    if (Number(parada.pedidoId) !== pedidoId) {
      throw new BadRequestException(
        'La parada no corresponde al pedido indicado',
      );
    }

    const vehiculo = await this.vehiculoModel.findByPk(
      recorrido.vehiculoId,
    );

    if (!vehiculo) {
      throw new BadRequestException(
        'El recorrido no tiene un vehículo válido asignado',
      );
    }

    if (Number(vehiculo.conductorId) !== Number(usuario.conductorId)) {
      throw new ForbiddenException(
        'No estás autorizado para registrar evidencias en este recorrido',
      );
    }

    const conductor = await this.conductorModel.findByPk(
      usuario.conductorId,
    );

    if (!conductor || !conductor.activo) {
      throw new ForbiddenException(
        'El conductor no existe o está inactivo',
      );
    }

    const latitud = this.validarCoordenada(
      dto.latitud,
      -90,
      90,
      'latitud',
    );

    const longitud = this.validarCoordenada(
      dto.longitud,
      -180,
      180,
      'longitud',
    );

    if ((latitud === null) !== (longitud === null)) {
      throw new BadRequestException(
        'Debes enviar latitud y longitud juntas',
      );
    }

    const observaciones = dto.observaciones?.trim() || null;

    if (observaciones && observaciones.length > 2000) {
      throw new BadRequestException(
        'Las observaciones no pueden superar los 2000 caracteres',
      );
    }

    // Primero se almacena la fotografía en Cloudinary.
    const imagen = await this.cloudinaryService.uploadImage(
      file.buffer,
      'routemind/evidencias',
    );

    try {
      // Después se registra la evidencia en PostgreSQL.
      const evidencia = await this.evidenciaModel.create({
        pedidoId,
        recorridoId,
        paradaRecorridoId,
        conductorId: usuario.conductorId,
        publicId: imagen.public_id,
        url: imagen.secure_url,
        formato: imagen.format,
        tamanoBytes: imagen.bytes,
        latitud,
        longitud,
        observaciones,
      });

      return {
        message: 'Evidencia de entrega registrada correctamente',
        evidencia,
      };
    } catch (error) {
      // Si falla PostgreSQL, intentamos eliminar la imagen
      // para evitar archivos huérfanos en Cloudinary.
      try {
        await this.cloudinaryService.deleteImage(imagen.public_id);
      } catch (cleanupError) {
        console.error(
          'No se pudo eliminar la imagen de Cloudinary:',
          cleanupError,
        );
      }

      console.error('Error al guardar evidencia:', error);

      throw new InternalServerErrorException(
        'La fotografía se subió, pero no se pudo registrar la evidencia',
      );
    }
  }

  private validarId(valor: string, campo: string): number {
    const id = Number(valor);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException(
        `${campo} debe ser un número entero positivo`,
      );
    }

    return id;
  }

  private validarCoordenada(
    valor: string | undefined,
    minimo: number,
    maximo: number,
    campo: string,
  ): number | null {
    if (valor === undefined || valor === null || valor.trim() === '') {
      return null;
    }

    const numero = Number(valor);

    if (
      !Number.isFinite(numero) ||
      numero < minimo ||
      numero > maximo
    ) {
      throw new BadRequestException(
        `${campo} tiene un valor inválido`,
      );
    }

    return numero;
  }
}
