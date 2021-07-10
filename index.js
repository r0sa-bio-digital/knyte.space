const Koa = require('koa');
const Router = require('koa-router');
const PG = require('pg');
const connectionString = process.env.DATABASE_URL;

const app = new Koa();
const PORT = process.env.PORT || 3000;
const router = new Router();
const pgClient = new PG.Client(connectionString);

router.get('/', async (ctx) => {
        ctx.body = {
        message: 'hello world from knyte.space!'
    };
});
router.get('/knytes', async (ctx) => {
    pgClient.connect();
    const query = pgClient.query("SELECT * from knytes");
    ctx.body = {
        query: query
    };
    pgClient.end();
});

app.use(router.routes());

const server = app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});