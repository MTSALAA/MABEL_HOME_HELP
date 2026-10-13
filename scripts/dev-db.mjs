// Starts a local Postgres for development (no Docker needed).
// Data lives in .pgdata/ and survives restarts. Stop with Ctrl+C.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const PORT = Number(process.env.DEV_DB_PORT ?? 5433);
const USER = "mabel";
const PASSWORD = "mabel";
const DATABASE = "mabel";

const databaseDir = path.resolve(".pgdata");
const isFresh = !existsSync(path.join(databaseDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
  onLog: () => {},
  onError: (error) => console.error(error),
});

if (isFresh) {
  await pg.initialise();
}
await pg.start();
if (isFresh) {
  await pg.createDatabase(DATABASE);
}

console.log(
  `Postgres ready: postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}`,
);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
