const koa = require('koa');
const koaRouter = require('koa-router');
const cors = require('kcors');
const pg = require('pg');
const connectionString = process.env.DATABASE_URL;
const webSocketServer = require('websocket').server;

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

router.get('/', async (ctx) => {
        ctx.body = {
        message: 'Hello, world!',
        from: 'knyte.space',
    };
});
router.get('/port', async (ctx) => {
    ctx.body = {port};
});
router.get('/now', async (ctx) => {
    const queryString = 'SELECT NOW()';
    ctx.body = {result: await runQuery(queryString)};
});
router.get('/knytes', async (ctx) => {
    const queryString = 'SELECT * FROM "public"."knytes" ORDER BY "knyte_id"';
    ctx.body = {result: await runQuery(queryString)};
});

app.use(cors());
app.use(router.routes());
listenDb();

const server = app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});

const wss = new webSocketServer({
    httpServer: server, 
    autoAcceptConnections: false // for development only
});
wss.on('request', function(request) {
    console.log(request);
    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' - connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});