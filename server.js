console.info('welcome to knyte space');
// common instances
const uuid = require('uuid').v4;
const uuidVersion = require('uuid').version;
const express = require('express');
const app = express();
const http = require('http').Server(app);
const pg = require('pg');
const io = require('socket.io')(http);
const ioClient = require('socket.io-client')('https://knyte-space.herokuapp.com/', {transports: ['polling']});
const connectionString = process.env.DATABASE_URL;
const accessTokens = {
    godLike: process.env.GOD_LIKE_ACCESS_TOKEN,
    readOnly: process.env.READ_ONLY_ACCESS_TOKEN,
};
const serverBootloaderKnyteId = 'b2f05808-577c-47da-86d9-67ab978a0fda';
const port = process.env.PORT || 3000;
let dbNotificationBotConnected = false;
app.use(express.json());
// access tokens format verification
if (uuidVersion(accessTokens.godLike) !== 4)
    throw Error('Invalid version of accessTokens.godLike');
if (accessTokens.readOnly && uuidVersion(accessTokens.readOnly) !== 4)
    throw Error('Invalid version of accessTokens.readOnly');
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
async function broadcastMessage(message) {
    await ioClient.connect();
    const {connected, disconnected, id, ids, nsp} = ioClient.emit('chat message', message);
    return {connected, disconnected, id, ids, nsp};
}
async function getSockets() {
    return await io.fetchSockets();
}
function directMessage(socketId, message) {
    io.to(socketId).emit('chat message', message);
}
const auth = {
    public: (req, res, next) => next(),
    godLike: (req, res, next) => {
        const t = req.get('accesstoken');
        (!t) ? res.status(400).end()
            : (t === accessTokens.godLike) ? next() : res.status(401).end();
    },
    readOnly: (req, res, next) => {
        const t = req.get('accesstoken');
        (!t) ? res.status(400).end() : (!accessTokens.readOnly) ? res.status(401).end()
            : (t === accessTokens.godLike || t === accessTokens.readOnly) ? next() : res.status(401).end();
    },
};
// event handlers for realtime updates
io.on('connection', (socket) => {
    socket.on('chat message', msg => {
        io.emit('chat message', msg);
    });
});
ioClient.on('connect', () => {
    dbNotificationBotConnected = true;
});
ioClient.on('disconnect', () => {
    dbNotificationBotConnected = false;
});
// boot the system
console.info('\tserver booting started');
const queryString = 'SELECT * FROM "public"."knytes" WHERE "knyte_id" = \'' + serverBootloaderKnyteId + '\';';
const serverContext = {app, uuid, auth, runQuery, broadcastMessage, getSockets, directMessage};
runQuery(queryString).then(
    (result) => {
        const serverBootloaderKnyte = result[0];
        try
        {
            const knyteFunction = new Function('thisKnyte, context', serverBootloaderKnyte.content);
            knyteFunction(serverBootloaderKnyte, serverContext);
        }
        catch (e)
        {
            console.error('\tserver bootloader failed');
            console.error(e);
        }
        // serve statics
        const public = ['/index.html', '/chat.html', '/favicon.ico'];
        app.get('/*', (req, res) => {
            // public method
            const resourceId = req.path === '/' ? '/index.html' : req.path;
            public.includes(resourceId) ? res.sendFile(__dirname + resourceId) : res.status(404).end();
        });
        // run services
        http.listen(port, () => {
            console.info(`\tPostgres/Socket.IO server running at port ${port}`);
        });
        listenDb().then(
            () => {
                console.info(`\tServer is listening db.notify.channel.watch_knytes_table`);
                console.info('\tsystem ready');
            }
        );
    }
);