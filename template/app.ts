import 'module-alias/register';
import fastify, { FastifyInstance } from 'fastify';
import config from '@config/constants';
import csrfProtection from '@fastify/csrf-protection';
import middie from '@fastify/middie';
import helmet from '@fastify/helmet';
import metricsPlugin from 'fastify-metrics';
import { randomUUID } from 'crypto';
const fs = require('fs');

class App {
  public app: FastifyInstance;

  public app_domain: string = config.app.domain;

  public app_port: number = config.app.port;

  public app_backlog: number = config.app.backlog;

  public debug: any = config.app.debug;

  constructor(appInit: { plugins: any; routes: any }) {
    const stream = fs.createWriteStream('app.log');

    this.app = fastify({
      logger: {
        redact: ['req.headers.authorization'],
        transport: {
          target: 'pino-pretty',
          //options: { destination: `${__dirname}/app.log` },
        },

        level: 'info',
        file: 'logs.txt',
        formatters: {
          bindings: bindings => {
            return { pid: bindings.pid, host: bindings.hostname };
          },
          level: label => {
            return { level: label.toUpperCase() };
          },
        },

        serializers: {
          req(request) {
            return {
              method: request.method,
              url: request.url,
              headers: request.headers,
              hostname: request.hostname,
              remoteAddress: request.ip,
              remotePort: request.socket.remotePort,
            };
          },
        },
      },
      ignoreTrailingSlash: true,
      requestIdLogLabel: 'trackingId',
      requestIdHeader: 'x-custom-id',
      genReqId: () => randomUUID(),
    });

    this.app.register(require('@fastify/url-data'), {
      version: 2, // versão inicial da API
    });
    this.app.register(middie, { hook: 'onRequest' });
    this.app.register(
      helmet,
      instance => {
        return {
          contentSecurityPolicy: {
            directives: {
              ...helmet.contentSecurityPolicy.getDefaultDirectives(),
              'form-action': ["'self'"],
              'img-src': ["'self'", 'data:', 'validator.swagger.io'],
              // "script-src":["'self'"].concat(instance.swaggerCSP.script),
              // "style-src":["'self'", "https:"].concat(instance.swaggerCSP.style)
            },
          },
        };
      },
      // Example disables the `contentSecurityPolicy` middleware but keeps the rest.
    );

    //  this.app.register(require('@fastify/jwt'), { secret: 'supersecret' });
    //this.app.register(require('@fastify/leveldb'), { name: 'authdb' })
    //this.app.register(require('@fastify/auth')); // just 'fastify-auth' IRL

    this.app.register(require('@fastify/cors'), {
     
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // <-- Allow necessary methods, including PUT and OPTIONS
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 3600,
    });
     this.app.register(require('@fastify/cookie'), {
      cookieName: 'sessionToken',
      secret: 'anscderdff',
      maxAge: 60 * 60,
    }); // See following section to ensure security
    this.app.register(csrfProtection, { cookieOpts: { signed: true } });

    /*   this.app.addHook('onRequest', (req, _reply, done) => {

      done();
    }); */

    this.app.addHook('preHandler', (req, _reply, done) => {
      if (req.body) {
        req.log.info({ body: req.body }, 'parsed body');
        req.id = randomUUID();
      }
      done();
    });

    this.app.register(metricsPlugin, {
      endpoint: '/metrics',
      routeMetrics: {
        overrides: {
          histogram: {
            name: 'my_custom_http_request_duration_seconds',
            buckets: [0.1, 0.5, 1, 3, 5],
          },
          summary: {
            help: 'custom request duration in seconds summary help',
            labelNames: ['status_code', 'method', 'route'],
            percentiles: [0.5, 0.75, 0.9, 0.95, 0.99],
          },
        },
      },
    });

    this.register(appInit.plugins);
    this.routes(appInit.routes);
  }

  private register(plugins: { forEach: (arg0: (plugin: any) => void) => void }) {
    plugins.forEach(plugin => {
      this.app.register(plugin);
    });
  }

  public routes(routes: { forEach: (arg0: (routes: any) => void) => void }) {
    routes.forEach(route => {
      const router = new route();
      this.app.register(router.routes, { prefix: router.prefix_route });
    });

    this.app.get(
      '/healthcheck',
      {
    
      },
      async (request, reply) => {
        reply.send({ healthcheck: 'server is alive' });
      },
    );
  }

  public listen() {
    this.app.listen(
      { port: this.app_port, host: this.app_domain, backlog: this.app_backlog },
      (err, address) => {
        if (err) {
          this.app.log.fatal({ msg: `Application startup error`, err });
          process.exit(1);
        }

        this.app.log.info(`App listening on the ${address} 🚀`);
      },
    );
  }
}

export default App;
