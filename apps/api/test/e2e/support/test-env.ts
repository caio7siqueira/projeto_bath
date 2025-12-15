import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { execFileSync } from "child_process";
import path from "path";

export interface TestEnv {
  pg: StartedTestContainer;
  redis: StartedTestContainer;
  stop: () => Promise<void>;
}

export async function startEnv(): Promise<TestEnv> {
  const pg = await new GenericContainer("postgres:15-alpine")
    .withEnvironment({
      POSTGRES_DB: "bath",
      POSTGRES_USER: "bath",
      POSTGRES_PASSWORD: "bath",
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections"))
    .start();

  const redis = await new GenericContainer("redis:7-alpine")
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
    .start();

  const databaseUrl = `postgresql://bath:bath@${pg.getHost()}:${pg.getMappedPort(5432)}/bath?schema=public`;
  const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;

  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_URL = redisUrl;

  // migrate
  const repoRoot = path.resolve(__dirname, "../../../..");
  const schemaPath = path.join(repoRoot, "prisma", "schema.prisma");
  execFileSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', [
    "exec",
    "prisma",
    "migrate",
    "deploy",
    "--schema",
    schemaPath,
  ], { stdio: "inherit", cwd: repoRoot });

  return {
    pg,
    redis,
    stop: async () => {
      await redis.stop();
      await pg.stop();
    }
  };
}
