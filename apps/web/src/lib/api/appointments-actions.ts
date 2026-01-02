import { AppointmentsService } from '@efizion/contracts';
import { apiFetch } from '../api';
import { safeSdkCall } from './errors';
import { unwrapData } from './sdk';

export async function markAppointmentDone(id: string) {
  const response = await safeSdkCall(
    AppointmentsService.appointmentsControllerMarkDone({ id }),
    'Não foi possível concluir o agendamento.',
  );
  return unwrapData(response as any);
}

export async function cancelAppointmentSeries(id: string) {
  return safeSdkCall(
    apiFetch(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ scope: 'SERIES' }),
    }),
    'Não foi possível cancelar os próximos atendimentos da série.',
  );
}
