// Healthcheck padrão para o worker
export function getHealth() {
  return {
    status: 'ok',
    app: 'worker',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
}
