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
    try {
        await pgClient.connect();
        console.log('connected');
    } catch(e) {
        console.warn(e);
    }
    const result = await pgClient.query('SELECT NOW()');
    try {
        await pgClient.end();
        console.log('disconnected');
    } catch(e) {
        console.warn(e);
    }
    ctx.body = {result};
});

app.use(router.routes());

const server = app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});