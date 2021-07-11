const koa = require('koa');
const router = require('koa-router');
const pg = require('pg');
const connectionString = process.env.DATABASE_URL;

const app = new koa();
const port = process.env.PORT || 3000;
const router = new router();

async function runQuery(queryString) {
    const pgClient = new pg.Client({
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