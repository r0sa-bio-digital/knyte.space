const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const PORT = process.env.PORT || 3000;
const router = new Router();

router.get('/', async (ctx) => {
    ctx.body = {
      status: 'success',
      message: 'hello, world!'
    };
  })
  
app.use(router.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});