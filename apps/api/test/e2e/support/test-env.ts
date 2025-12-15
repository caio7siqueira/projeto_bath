import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

export interface TestEnv {
  pg: StartedTestContainer;
  redis: StartedTestContainer;
  databaseUrl: string;
  redisUrl: string;
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

  try {
    const databaseUrl = `postgresql://bath:bath@${pg.getHost()}:${pg.getMappedPort(5432)}/bath?schema=public`;
    const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;

    return {
      pg,
      redis,
      databaseUrl,
      redisUrl,
      stop: async () => {
        await redis.stop();
        await pg.stop();
      }
    };
  } catch (error) {
    await redis.stop();
    await pg.stop();
    throw error;
  }
}
