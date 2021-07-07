import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import * as flags from "https://deno.land/std/flags/mod.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";

const DEFAULT_PORT = 8080;
const argPort = flags.parse(Deno.args).port;
const port = argPort ? Number(argPort) : DEFAULT_PORT;

const app = new Application();
const router = new Router();
const db = new Client(Deno.env.get("DATABASE_URL"));
router
  .get("/ping", (ctx) => {
    ctx.response.body = `Hello Knyte World! Deno ${Deno.version.deno} is in charge!\n`;
  })
  .get("/knytes", async (ctx) => {
    await db.connect();
    const result = await db.queryObject("SELECT ID, NAME FROM PEOPLE");
    await db.end();
    ctx.response.body = result.rows;
    console.log(result);
  });
app.use(router.routes());
app.use(router.allowedMethods());
app.listen({port});
console.log("http://localhost:" + port);
