'use strict';

const Pino = require('pino');
const { multistream: Multistream } = require('pino-multi-stream');
const SentryStream = require('./sentry/stream');
const Sentry = require('./sentry/index');

const internals = {
    defaults: {
        level: 'info',
        messageKey: 'data',
        redact: [
            'body.data.key',
            'body.data.secret',
            'data.body.token',
            'encryptedPassword',
            'event.token',
            'headers.authorization',
            'headers.Authorization',
            'message.payload.token',
            'message.token',
            'password',
            'req.headers.authorization',
            'req.headers.Authorization',
            'requestPayload.authCode',
            'requestPayload.password',
            'requestPayload.user.password',
            'responsePayload.token',
            'token'
        ]
    }
};

const createLogger = exports.createLogger = (options = {}, destination) => {

    if (!options.sentry) {
        options.sentry = Sentry();
    }

    options.redact = (options.redact || []).concat(internals.defaults.redact);
    const config = {
        ...internals.defaults,
        ...options
    };

    if (options.prettyPrint === undefined && process.env.NODE_ENV !== 'production') {
        config.prettyPrint = true;
    }

    if (destination || config.prettyPrint) { // we cannot use prettyPrint with Multistream
        return new Pino(config, destination);
    }

    const streams = [
        { level: 'info', stream: process.stdout },
        { level: 'error', stream: SentryStream(config.sentry) }
    ];

    return new Pino(config, Multistream(streams));
};

exports.logger = exports.default = createLogger();
