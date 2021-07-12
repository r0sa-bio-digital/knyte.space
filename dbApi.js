const appExpress = require('express')();
const http = require('http').Server(appExpress);
const pg = require('pg');
const io = require('socket.io')(http);
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

appExpress.get('/now', async (req, res) => {
    const queryString = 'SELECT NOW()';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
appExpress.get('/knytes', async (req, res) => {
    const queryString = 'SELECT * FROM "public"."knytes" ORDER BY "knyte_id"';
    res.send(JSON.stringify({result: await runQuery(queryString)}));
});
appExpress.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
appExpress.get('/list', (req, res) => {
    res.sendFile(__dirname + '/list.html');
});
appExpress.get('/favicon.ico', (req, res) => {
    res.sendFile(__dirname + '/favicon.ico');
});
appExpress.get('/font/MesloLGM-Regular.ttf', (req, res) => {
    res.sendFile(__dirname + '/font/MesloLGM-Regular.ttf');
});
io.on('connection', (socket) => {
    socket.on('chat message', msg => {
        io.emit('chat message', msg);
    });
});

listenDb();
http.listen(port, () => {
    console.log(`Socket.IO server running at port ${port}`);
});