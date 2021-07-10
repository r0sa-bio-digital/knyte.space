const Koa = require('koa');
const Router = require('koa-router');
//const PG = require('pg');
const connectionString = process.env.GREETING;
console.log('connectionString');
console.log(connectionString);

const app = new Koa();
const PORT = process.env.PORT || 3000;
const router = new Router();

router.get('/', async (ctx) => {
    ctx.body = {
      message: 'hello world from knyte.space!'
    };
  })
  
app.use(router.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});