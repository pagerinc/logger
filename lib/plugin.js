'use strict';

const Logger = require('./logger');
const HapiPino = require('hapi-pino');
const HapiSentry = require('./sentry/hapi');
const Hoek = require('@hapi/hoek');
const ReqSerializer = require('./req-serializer');

const internals = {
    defaults: {
        serializers: {
            req: ReqSerializer
        },
        ignorePaths: ['/health', '/healthcheck', '/metrics'],
        exposeErrors: process.env.LOG_EXPOSE_ERRORS
    }
};

module.exports = {
    pkg: require('../package.json'),
    register: async (server, options) => {

        const pinoOpts = {
            ...internals.defaults,
            ...{ instance: options.instance || Logger.logger },
            ...options.pino
        };

        await HapiPino.register(server, pinoOpts);
        await HapiSentry.register(server, options.sentry);

        if (options.exposeErrors) {
            server.ext('onPreResponse', (request, h) => {

                if (request.response.isBoom && request.response.output.statusCode >= 500) {
                    request.response.output.payload.details = {
                        message: request.response.message,
                        url: request.url.path,
                        headers: Hoek.clone(request.raw.req.headers),
                        stack: request.response.stack
                    };
                }

                return h.continue;
            });
        }
    }
};
