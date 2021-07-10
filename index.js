const Koa = require('koa');
const Router = require('koa-router');
const PG = require('pg');
const connectionString = process.env.DATABASE_URL;

const app = new Koa();
const PORT = process.env.PORT || 3000;
const router = new Router();

router.get('/', async (ctx) => {
        ctx.body = {
        message: 'hello world from knyte.space!'
    };
});
router.get('/now', async (ctx) => {
    const pgClient = new PG.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });    
    try {
        await pgClient.connect();
        console.log('connected');
    } catch(e) {
        console.warn(e);
    }
    let result = {};
    try {
        const queryString = 'SELECT NOW()';
        result = (await pgClient.query(queryString)).rows;
        console.log('query done: ' + queryString);
    } catch (e) {
        console.warn(e);
    }
    try {
        await pgClient.end();
        console.log('disconnected');
    } catch(e) {
        console.warn(e);
    }
    ctx.body = {result};
});
router.get('/knytes', async (ctx) => {
    const pgClient = new PG.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });    
    try {
        await pgClient.connect();
        console.log('connected');
    } catch(e) {
        console.warn(e);
    }
    let result = {};
    try {
        const queryString = 'SELECT * FROM "public"."knytes" ORDER BY "knyte_id"';
        result = (await pgClient.query(queryString)).rows;
        console.log('query done: ' + queryString);
    } catch (e) {
        console.warn(e);
    }
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