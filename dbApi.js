// common instances
const uuid = require('uuid').v4;
const app = require('express')();
const bodyParser = require('body-parser')
const http = require('http').Server(app);
const pg = require('pg');
const io = require('socket.io')(http);
const ioClient = require("socket.io-client")('https://knyte-space.herokuapp.com/', {transports: ["polling"]});
const connectionString = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;
let dbNotificationBotConnected = false;
app.use(bodyParser.json());
// common functions
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
    client.on('notification', async function(msg) {
        await ioClient.connect();
        ioClient.emit('chat message', JSON.stringify(msg));
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
// test kit
app.get('/ping', async (req, res) => {
    res.send(JSON.stringify({result: 'pong ' + uuid()}));
});
app.get('/now', async (req, res) => {
    const queryString = 'SELECT NOW()';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/bot', async (req, res) => {
    await ioClient.connect();
    const {connected, disconnected, id, ids, nsp} = ioClient.emit('chat message', 'I am @ B0T 🤖');
    res.send(JSON.stringify({result: {connected, disconnected, id, ids, nsp}}));
});
// db interface
app.get('/knytes', async (req, res) => {
    const queryString = 'SELECT * FROM "public"."knytes" ORDER BY "knyte_id";';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/knyte/:knyteId', async (req, res) => {
    const knyteId = req.params.knyteId.split('=')[1];
    const queryString = 'SELECT * FROM "public"."knytes" WHERE "knyte_id" = \'' + knyteId + '\';';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/newknyte', async (req, res) => {
    const knyteId = uuid();
    const queryString = 'INSERT INTO "public"."knytes" ("knyte_id") VALUES (\'' + knyteId + '\');';
    res.send(JSON.stringify({result: await runQuery(queryString), knyteId}));
});
app.get('/deleteknyte/:knyteId', async (req, res) => {
    const knyteId = req.params.knyteId.split('=')[1];
    const queryString = 'DELETE FROM "public"."knytes" WHERE "knyte_id" = \'' + knyteId + '\';';
    res.send(JSON.stringify({result: await runQuery(queryString), knyteId}));
});
app.get('/updateknyte/:knyteId/origin/:originId', async (req, res) => {
    const knyteId = req.params.knyteId.split('=')[1];
    const originId = req.params.originId.split('=')[1];
    const originIdValue = originId !== 'null' ? "'" + originId + "'" : 'NULL';
    const queryString = 'UPDATE "public"."knytes" SET "origin_id" = ' + originIdValue + ' WHERE "knyte_id" = \'' + knyteId + '\';';
    console.log('queryString');
    try
    {
        const result = await runQuery(queryString);
        console.log('result');
        console.log(result);
        res.send(JSON.stringify({result, knyteId}));
    }
    catch(e)
    {
        const error = JSON.stringify(e);
        console.log('error');
        console.log(error);
        res.send(error);
    }
});
app.get('/updateknyte/:knyteId/termination/:terminationId', async (req, res) => {
    const knyteId = req.params.knyteId.split('=')[1];
    const terminationId = req.params.terminationId.split('=')[1];
    const terminationIdValue = terminationId !== 'null' ? "'" + terminationId + "'" : 'NULL';
    const queryString = 'UPDATE "public"."knytes" SET "termination_id" = ' + terminationIdValue + ' WHERE "knyte_id" = \'' + knyteId + '\';';
    res.send(JSON.stringify({result: await runQuery(queryString), knyteId}));
});
app.post('/updateknyte/:knyteId/content', async (req, res) => {
    const knyteId = req.params.knyteId.split('=')[1];
    const contentValue = req.body.content ? "'" + req.body.content.replaceAll("'", "''") + "'" : 'NULL'; // replaceAll for pg value string encoding
    const queryString = 'UPDATE "public"."knytes" SET "content" = ' + contentValue + ' WHERE "knyte_id" = \'' + knyteId + '\';';
    res.send(JSON.stringify({result: await runQuery(queryString), knyteId}));
});
// serve statics
const public = ['/index.html', '/chat.html', '/favicon.ico', '/font/meslo.css', '/font/MesloLGM-Bold.ttf',
    '/font/MesloLGM-BoldItalic.ttf', '/font/MesloLGM-Italic.ttf', '/font/MesloLGM-Regular.ttf'];
app.get('/*', (req, res) => {
    const resourceId = req.path === '/' ? '/index.html' : req.path;
    public.includes(resourceId) ? res.sendFile(__dirname + resourceId) : res.status(404).end();
});
// event handlers for realtime updates
io.on('connection', (socket) => {
    socket.on('chat message', msg => {
        io.emit('chat message', msg);
    });
});
ioClient.on("connect", () => {
    dbNotificationBotConnected = true;
});
ioClient.on("disconnect", () => {
    dbNotificationBotConnected = false;
});
// run services
http.listen(port, () => {
    console.log(`Postgres/Socket.IO server running at port ${port}`);
});
listenDb().then(() => console.log(`Server is listening db.notify.channel.watch_knytes_table`));