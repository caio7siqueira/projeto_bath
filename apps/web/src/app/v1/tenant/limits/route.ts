import { NextResponse } from 'next/server';

const MOCK_LIMITS = {
  customers: 500,
  pets: 800,
  appointmentsPerMonth: 300,
  smsCredits: 500,
  whatsappCredits: 300,
  automations: 50,
};

export function GET() {
  return NextResponse.json(MOCK_LIMITS, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
