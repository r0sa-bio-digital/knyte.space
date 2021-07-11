const koa = require('koa');
const koaRouter = require('koa-router');
const pg = require('pg');
const connectionString = process.env.DATABASE_URL;

const app = new koa();
const port = process.env.PORT || 3000;
const router = new koaRouter();

async function runQuery(queryString) {
    const client = new pg.Client({
        connectionString,
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    });    
    try {
        await client.connect();
        console.log('connected');
    } catch(e) {
        console.warn(e);
    }
    let result = {};
    try {
        result = (await client.query(queryString)).rows;
        console.log('query done: ' + queryString);
    } catch (e) {
        console.warn(e);
    }
    try {
        await client.end();
        console.log('disconnected');
    } catch(e) {
        console.warn(e);
    }
    return result;
}

router.get('/', async (ctx) => {
        ctx.body = {
        message: 'hello world from knyte.space!'
    };
});
router.get('/now', async (ctx) => {
    const queryString = 'SELECT NOW()';
    ctx.body = {result: await runQuery(queryString)};
});
router.get('/knytes', async (ctx) => {
    const queryString = 'SELECT * FROM "public"."knytes" ORDER BY "knyte_id"';
    ctx.body = {result: await runQuery(queryString)};
});

app.use(router.routes());

const server = app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});