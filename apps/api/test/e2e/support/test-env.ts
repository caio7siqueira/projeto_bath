import { GenericContainer, StartedTestContainer } from "@testcontainers/testcontainers";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import { execFileSync } from "node:child_process";
import path from "node:path";

export interface TestEnv {
  pg: StartedPostgreSqlContainer;
  redis: StartedRedisContainer;
  stop: () => Promise<void>;
}

export async function startEnv(): Promise<TestEnv> {
  const pg = await new PostgreSqlContainer()
    .withDatabase("bath")
    .withUsername("bath")
    .withPassword("bath")
    .start();

  const redis = await new RedisContainer().start();

  const databaseUrl = pg.getConnectionUri();
  const redisUrl = `redis://${redis.getHost()}:${redis.getFirstMappedPort()}`;

  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_URL = redisUrl;

  // migrate
  const cwd = path.resolve(__dirname, "../../../..");
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
    "prisma",
    "migrate",
    "deploy"
  ], { stdio: "inherit", cwd });

  return {
    pg,
    redis,
    stop: async () => {
      await redis.stop();
      await pg.stop();
    }
  };
}
