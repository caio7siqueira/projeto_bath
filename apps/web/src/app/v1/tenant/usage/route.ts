import { NextResponse } from 'next/server';

const MOCK_USAGE = {
  customers: 187,
  pets: 241,
  appointmentsPerMonth: 92,
  smsCredits: 120,
  whatsappCredits: 84,
  automations: 26,
};

export function GET() {
  return NextResponse.json(MOCK_USAGE, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
