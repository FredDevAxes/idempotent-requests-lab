import { createPool, migrate } from "./database";
const pool = createPool();
migrate(pool)
  .then(() => console.log("Lab migrations applied"))
  .finally(() => pool.end())
  .catch(() => {
    console.error("Migration failed; check database configuration");
    process.exitCode = 1;
  });
