const koa = require('koa');
const koaRouter = require('koa-router');
const cors = require('kcors');
const pg = require('pg');
const connectionString = process.env.DATABASE_URL;

const app = new koa();
const port = process.env.PORT || 3000;
const router = new koaRouter();

async function listenDb() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    });    
    try {
        await client.connect();
    } catch(e) {
        console.warn(e);
    }
    client.on('notification', function(msg) {
        console.log('watch_knytes_table event:');
        console.log(msg);
    });
    const query = client.query('LISTEN watch_knytes_table');    
}

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
    } catch(e) {
        console.warn(e);
    }
    let result = {};
    try {
        result = (await client.query(queryString)).rows;
    } catch (e) {
        console.warn(e);
    }
    try {
        await client.end();
    } catch(e) {
        console.warn(e);
    }
    return result;
}
router.get('/now', async (ctx) => {
    const queryString = 'SELECT NOW()';
    ctx.body = {result: await runQuery(queryString)};
});
router.get('/knytes', async (ctx) => {
    const queryString = 'SELECT * FROM "public"."knytes" ORDER BY "knyte_id"';
    ctx.body = {result: await runQuery(queryString)};
});

app.use(cors());
app.use(require('koa-static')('.'));
app.use(router.routes());
listenDb();

const server = app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});