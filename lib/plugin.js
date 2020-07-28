'use strict';

const Logger = require('./logger');
const HapiPino = require('hapi-pino');
const HapiSentry = require('./sentry/hapi');
const ReqSerializer = require('./req-serializer');

const internals = {
    defaults: {
        serializers: {
            req: ReqSerializer
        },
        ignorePaths: ['/health', '/healthcheck', '/metrics'],
        getChildBindings: () => ({})
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
    }
};
