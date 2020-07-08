const 
path   = require("path"),
app    = require('fastify')({ logger: true }),
router = require("./router"),
cfg    = require('./config');

// plug in 
app.register(require('fastify-cookie'));
app.register(require('fastify-session'), {
    secret: 'a secret with minimum length of 32 characters',
    cookie: {
        secure: false,
    }
});
app.register(require('fastify-static'), {
    root: path.join(__dirname, 'static'),
    prefix: '/', // optional: default '/'
})

// set router
router.setRouter(app);

// Run the server!
const start = async () => {
    try {
        await app.listen(cfg.port,cfg.host);
        app.log.info(`server listening on ${app.server.address().port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

setTimeout(start,1000);