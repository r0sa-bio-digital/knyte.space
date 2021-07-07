import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import * as flags from "https://deno.land/std/flags/mod.ts";

const DEFAULT_PORT = 8080;
const argPort = flags.parse(Deno.args).port;
const port = argPort ? Number(argPort) : DEFAULT_PORT;

const app = new Application();
const router = new Router();
router
  .get("/ping", (ctx) => {
    ctx.response.body = `Hello Knyte World! Deno ${Deno.version.deno} is in charge!\n`;
  });
app.use(router.routes());
app.use(router.allowedMethods());
app.listen({port});
console.log("http://localhost:" + port);
