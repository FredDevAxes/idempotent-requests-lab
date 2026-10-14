import { createPool } from "./database";
import { createApp } from "./app";
const pool = createPool();
async function main() {
  const app = await createApp(pool);
  await app.listen(Number(process.env.API_PORT ?? 3100), "127.0.0.1");
  console.log(`API ready ${await app.getUrl()}`);
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.on(signal, () => {
      void app
        .close()
        .then(() => pool.end())
        .then(() => process.exit(0));
    });
}
main().catch(() => {
  console.error("API startup failed");
  process.exitCode = 1;
});
