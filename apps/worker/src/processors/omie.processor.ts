import { Job } from 'bullmq';

export interface OmieJobData {
  eventId: string;
}

export async function processOmieJob(job: Job<OmieJobData>): Promise<void> {
  console.log(`[OMIE] Processing job ${job.id}`, job.data);

  const { eventId } = job.data;

  try {
    // Chamar API backend para processar evento Omie
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/internal/omie/process/${eventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    console.log(`[OMIE] Successfully processed event ${eventId}`);
  } catch (error) {
    console.error(`[OMIE] Job ${job.id} failed:`, error);
    throw error; // Relançar para retry automático do BullMQ
  }
}
