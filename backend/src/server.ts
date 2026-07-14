import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { startScheduler } from './config/scheduler';

async function main() {
  const app = createApp();

  // Fail fast if the DB is unreachable.
  await prisma.$connect();

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 API listening on http://localhost:${env.port}/api`);
    // eslint-disable-next-line no-console
    console.log(`📚 Swagger docs at   http://localhost:${env.port}/api/docs`);
  });

  startScheduler();

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received, shutting down…`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', err);
  process.exit(1);
});
