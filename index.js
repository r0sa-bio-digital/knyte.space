const Koa = require('koa');
const Router = require('koa-router');
const PG = require('pg');
const connectionString = process.env.DATABASE_URL;

const app = new Koa();
const PORT = process.env.PORT || 3000;
const router = new Router();
const pgClient = new PG.Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

router.get('/', async (ctx) => {
        ctx.body = {
        message: 'hello world from knyte.space!'
    };
});
router.get('/knytes', async (ctx) => {
    await pgClient.connect();
    const result = await pgClient.query('SELECT NOW()');
    await pgClient.end();
    ctx.body = {result};
});

app.use(router.routes());

const server = app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});