const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.NEXT_PUBLIC_DEMO_TOKEN || '';

export interface Location {
  id: string;
  name: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationDto {
  name: string;
}

export async function listLocations(): Promise<Location[]> {
  const res = await fetch(`${API_BASE}/v1/locations`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Failed to list locations: ${res.status}`);
  return res.json();
}

export async function createLocation(dto: CreateLocationDto): Promise<Location> {
  const res = await fetch(`${API_BASE}/v1/locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`Failed to create location: ${res.status}`);
  return res.json();
}
