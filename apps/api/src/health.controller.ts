import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return { 
      message: 'Efizion Bath API', 
      version: '0.1.0',
      docs: '/docs',
      health: '/v1/health'
    };
  }

  @Get('health')
  health() {
    return { ok: true, timestamp: new Date().toISOString() };
  }
}
