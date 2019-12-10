'use strict';

const { Severity } = require('@sentry/node');
const Joi = require('@hapi/joi');

const internals = {
    /* $lab:coverage:off$ */
    levels: Object.values(Severity).filter((level) => typeof level === 'string')
        || ['fatal', 'error', 'warning', 'log', 'info', 'debug', 'critical']
    /* $lab:coverage:on$ */
};

internals.baseSentry = Joi.object({
    scope: Joi.object({
        tags: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            value: Joi.any().required()
        })),
        level: Joi.string().valid(...internals.levels),
        extra: Joi.object()
    }),
    client: Joi.object({
        dsn: Joi.string().uri().allow(false),
        debug: Joi.boolean(),
        release: Joi.string(),
        environment: Joi.string(),
        sampleRate: Joi.number().min(0).max(1),
        maxBreadcrumbs: Joi.number().integer(),
        attachStacktrace: Joi.boolean().default(true),
        sendDefaultPii: Joi.boolean(),
        serverName: Joi.string(),
        beforeSend: Joi.func(),
        beforeBreadcrumb: Joi.func()
    }).default({})
}).unknown();

internals.hapiSentry = internals.baseSentry.keys({
    baseUri: Joi.string().uri(),
    channels: Joi.array()
        .items(Joi.string().valid(...internals.levels))
        .single()
        .default('error'),
    trackUser: Joi.boolean().default(true)
});

module.exports = {
    SentrySchema: internals.baseSentry,
    HapiSentrySchema: internals.hapiSentry
};
