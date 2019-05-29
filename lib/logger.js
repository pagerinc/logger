'use strict';

const Pino = require('pino');
const { multistream: Multistream } = require('pino-multi-stream');
const SentryStream = require('./sentry/stream');
const { default: Sentry } = require('./sentry/index');

const internals = {
    defaults: {
        /* $lab:coverage:off$ */
        level: process.env.LOG_LEVEL || 'info',
        errorThreshold: process.env.LOG_ERROR_THRESHOLD || 'error',
        /* $lab:coverage:on$ */
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
        ],
        prettyPrint: process.env.LOG_PRETTY_PRINT
    },
    handleRejections: (logger) => {

        /** Tested manually, but to remove the coverage:off we either:
        /*  - Inject an abstraction
        /*  - Figure out how to gracefully test
        /*  Remove this once one of these are done
        **/
        /* $lab:coverage:off$ */
        process.on('unhandledRejection', (err) => {

            // best effort to log, but fail safely
            try {
                logger.error('unhandled rejection caught');
                logger.error(err);
            }
            catch (logError) {
                console.error('Failure to log unhandled rejection', err);
                console.error('Logging error on unhandled rejection', logError);
            }
            finally {
                process.exit(1);
            }
        });
        /* $lab:coverage:on$ */
    }
};

internals.createLogger = (options = {}, destination) => {

    if (!options.sentry) {
        options.sentry = Sentry;
    }

    // enforce append-only redaction
    options.redact = (options.redact || []).concat(internals.defaults.redact);
    const config = {
        ...internals.defaults,
        ...options
    };

    if (destination || config.prettyPrint) { // we cannot use prettyPrint with Multistream
        const result = new Pino(config, destination);
        internals.handleRejections(result);
        return result;
    }

    const streams = [
        { level: config.level, stream: process.stdout },
        { level: config.errorThreshold, stream: SentryStream(config.sentry) }
    ];

    const result = new Pino(config, Multistream(streams));
    internals.handleRejections(result);
    return result;
};

const _logger = internals.createLogger(); // Singleton default

module.exports = {
    logger: _logger,
    createLogger: internals.createLogger
};
