const app = require('express')();
const http = require('http').Server(app);
const pg = require('pg');
const io = require('socket.io')(http);
const ioClient = require("socket.io-client")('https://knyte-space.herokuapp.com/');
const connectionString = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;

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

app.get('/now', async (req, res) => {
    const queryString = 'SELECT NOW()';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/knytes', async (req, res) => {
    const queryString = 'SELECT * FROM "public"."knytes" ORDER BY "knyte_id"';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/knyte/:knyteId', async (req, res) => {
    console.log(req.params);
    const knyteId = req.params.knyteId.split('=')[1];
    console.log(knyteId);
    const queryString = 'SELECT * FROM "public"."knytes" WHERE "knyte_id" = \'' + knyteId + '\'';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
app.get('/message', async (req, res) => {
    await ioClient.connect();
    const {connected, disconnected, id, ids, nsp} = ioClient.emit('chat message', 'I am @ B0T 🤖');
    res.send(JSON.stringify({result: {connected, disconnected, id, ids, nsp}}));
});
const public = ['/index.html', '/chat.html', '/favicon.ico', '/font/MesloLGM-Bold.ttf',
    '/font/MesloLGM-BoldItalic.ttf', '/font/MesloLGM-Italic.ttf', '/font/MesloLGM-Regular.ttf'];
app.get('/*', (req, res) => {
    const resourceId = req.path === '/' ? '/index.html' : req.path;
    public.includes(resourceId) ? res.sendFile(__dirname + resourceId) : res.status(404).end();
});
io.on('connection', (socket) => {
    socket.on('chat message', msg => {
        io.emit('chat message', msg);
    });
});
ioClient.on("connect", () => {
    console.log('>>> bot connected: ' + ioClient.id);
});
ioClient.on("disconnect", () => {
    console.log('>>> bot disconnected: ' + ioClient.id);
});

listenDb();
http.listen(port, () => {
    console.log(`Socket.IO server running at port ${port}`);
});