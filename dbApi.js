// common instances
const uuid = require('uuid').v4;
const uuidVersion = require('uuid').version;
const app = require('express')();
const bodyParser = require('body-parser')
const http = require('http').Server(app);
const pg = require('pg');
const io = require('socket.io')(http);
const ioClient = require("socket.io-client")('https://knyte-space.herokuapp.com/', {transports: ["polling"]});
const connectionString = process.env.DATABASE_URL;
const accessTokens = {
    godLike: process.env.GOD_LIKE_ACCESS_TOKEN,
    readOnly: process.env.READ_ONLY_ACCESS_TOKEN,
};
const bootloaderKnyteId = '2ac04735-106f-4179-aa49-bdbe5e740d77';
const port = process.env.PORT || 3000;
let dbNotificationBotConnected = false;
app.use(bodyParser.json());
// access tokens format verification
{
    if (uuidVersion(accessTokens.godLike) !== 4)
        throw Error('Invalid version of accessTokens.godLike');
    if (accessTokens.readOnly && uuidVersion(accessTokens.readOnly) !== 4)
        throw Error('Invalid version of accessTokens.readOnly');
}
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
        return {error: e, step: 'client connect'};
    }
    let result = {};
    try {
        result = (await client.query(queryString)).rows;
    } catch (e) {
        console.warn(e);
        result = {error: e, step: 'client query'};
    }
    try {
        await client.end();
    } catch(e) {
        console.warn(e);
        return {error: e, step: 'client end'};
    }
    return result;
}
function checkAccess(accessToken, role)
{
    if (accessToken === accessTokens.godLike)
        return true;
    if (role === 'read-only' && accessTokens.readOnly && accessToken === accessTokens.readOnly)
        return true;
    return false;
}
// test kit
app.get('/ping', async (req, res) => {
    // public method
    res.send(JSON.stringify({result: 'pong ' + uuid()}));
});
app.get('/now', async (req, res) => {
    // public method
    const queryString = 'SELECT NOW()';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/bot', async (req, res) => {
    // read-only method
    if (!checkAccess(req.get('accesstoken'), 'read-only'))
    {
        res.status(401).end();
        return;
    }

    await ioClient.connect();
    const {connected, disconnected, id, ids, nsp} = ioClient.emit('chat message', 'I am @ B0T 🤖');
    res.send(JSON.stringify({result: {connected, disconnected, id, ids, nsp}}));
});
// db interface
app.get('/knytes', async (req, res) => {
    // read only method
    if (!checkAccess(req.get('accesstoken'), 'read-only'))
    {
        res.status(401).end();
        return;
    }

    const queryString = 'SELECT * FROM "public"."knytes" ORDER BY "knyte_id";';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/knyte/:knyteId', async (req, res) => {
    // read only method
    if (!checkAccess(req.get('accesstoken'), 'read-only'))
    {
        res.status(401).end();
        return;
    }

    const knyteId = req.params.knyteId.split('=')[1];
    const queryString = 'SELECT * FROM "public"."knytes" WHERE "knyte_id" = \'' + knyteId + '\';';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/bootloaderknyte', async (req, res) => {
    // public method
    const queryString = 'SELECT * FROM "public"."knytes" WHERE "knyte_id" = \'' + bootloaderKnyteId + '\';';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/newknyte', async (req, res) => {
    // god-like method
    if (!checkAccess(req.get('accesstoken'), 'god-like'))
    {
        res.status(401).end();
        return;
    }

    const knyteId = uuid();
    const queryString = 'INSERT INTO "public"."knytes" ("knyte_id") VALUES (\'' + knyteId + '\');';
    res.send(JSON.stringify({result: await runQuery(queryString), knyteId}));
});
app.get('/deleteknyte/:knyteId', async (req, res) => {
    // god-like method
    if (!checkAccess(req.get('accesstoken'), 'god-like'))
    {
        res.status(401).end();
        return;
    }

    const knyteId = req.params.knyteId.split('=')[1];
    const queryString = 'DELETE FROM "public"."knytes" WHERE "knyte_id" = \'' + knyteId + '\';';
    res.send(JSON.stringify({result: await runQuery(queryString), knyteId}));
});
app.get('/updateknyte/:knyteId/origin/:originId', async (req, res) => {
    // god-like method
    if (!checkAccess(req.get('accesstoken'), 'god-like'))
    {
        res.status(401).end();
        return;
    }

    const knyteId = req.params.knyteId.split('=')[1];
    const originId = req.params.originId.split('=')[1];
    const originIdValue = originId !== 'null' ? "'" + originId + "'" : 'NULL';
    const queryString = 'UPDATE "public"."knytes" SET "origin_id" = ' + originIdValue + ' WHERE "knyte_id" = \'' + knyteId + '\';';
    const result = await runQuery(queryString);
    res.send(JSON.stringify({result, knyteId}));
});
app.get('/updateknyte/:knyteId/termination/:terminationId', async (req, res) => {
    // god-like method
    if (!checkAccess(req.get('accesstoken'), 'god-like'))
    {
        res.status(401).end();
        return;
    }

    const knyteId = req.params.knyteId.split('=')[1];
    const terminationId = req.params.terminationId.split('=')[1];
    const terminationIdValue = terminationId !== 'null' ? "'" + terminationId + "'" : 'NULL';
    const queryString = 'UPDATE "public"."knytes" SET "termination_id" = ' + terminationIdValue + ' WHERE "knyte_id" = \'' + knyteId + '\';';
    res.send(JSON.stringify({result: await runQuery(queryString), knyteId}));
});
app.post('/updateknyte/:knyteId/content', async (req, res) => {
    // god-like method
    if (!checkAccess(req.get('accesstoken'), 'god-like'))
    {
        res.status(401).end();
        return;
    }

    const knyteId = req.params.knyteId.split('=')[1];
    const contentValue = req.body.content ? "'" + req.body.content.replaceAll("'", "''") + "'" : 'NULL'; // replaceAll for pg value string encoding
    const queryString = 'UPDATE "public"."knytes" SET "content" = ' + contentValue + ' WHERE "knyte_id" = \'' + knyteId + '\';';
    res.send(JSON.stringify({result: await runQuery(queryString), knyteId}));
});
// serve statics
const public = ['/index.html', '/chat.html', '/favicon.ico', '/font/meslo.css', '/font/MesloLGM-Bold.ttf',
    '/font/MesloLGM-BoldItalic.ttf', '/font/MesloLGM-Italic.ttf', '/font/MesloLGM-Regular.ttf'];
app.get('/*', (req, res) => {
    // public method
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