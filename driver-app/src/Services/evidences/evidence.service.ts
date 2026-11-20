import { apiRequest } from '../api/api';

export interface DeliveryEvidenceInput {
  file: File;
  pedidoId: number;
  recorridoId: number;
  paradaRecorridoId: number;
  latitud: number;
  longitud: number;
}

export const evidenceService = {
  async createEvidence(
    evidence: DeliveryEvidenceInput,
    token: string,
  ): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', evidence.file);
    formData.append('pedidoId', String(evidence.pedidoId));
    formData.append('recorridoId', String(evidence.recorridoId));
    formData.append(
      'paradaRecorridoId',
      String(evidence.paradaRecorridoId),
    );
    formData.append('latitud', String(evidence.latitud));
    formData.append('longitud', String(evidence.longitud));

    return apiRequest<unknown>('/evidencias', {
      method: 'POST',
      body: formData,
      token,
      timeoutMs: 60_000,
    });
  },
};
