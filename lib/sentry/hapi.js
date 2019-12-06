'use strict';

const { default: Sentry } = require('./index');
const Joi = require('@hapi/joi');
const { HapiSentrySchema } = require('./schema');
const SentryNode = require('@sentry/node');

module.exports = {
    register: (server, options = {}) => {

        Joi.attempt(options, HapiSentrySchema, 'Invalid hapi-sentry options:');
        let sentry = options.sentry;
        if (!sentry) {
            sentry = Sentry;
        }

        // expose sentry client at server.plugins['hapi-sentry'].client
        server.expose('client', sentry);

        // attach a new scope to each request for breadcrumbs/tags/extras/etc capturing
        sentry.configureScope((scope) => {

            scope.addEventProcessor((event) => {

                // TODO: add test coverage for this
                /* $lab:coverage:off$ */
                if (event.req) {
                    SentryNode.Handlers.parseRequest(event, event.req, options);
                    event.user = event.req.headers && event.req.headers['x-consumer-username'];
                }

                return event;
                /* $lab:coverage:on$ */
            });
        });
    },
    name: 'hapi-sentry'
};
