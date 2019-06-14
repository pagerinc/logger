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
        server.ext('onRequest', (request, h) => {

            sentry.configureScope((scope) => {

                scope.addEventProcessor((event) => {

                    // TODO: add test coverage for this
                    /* $lab:coverage:off$ */
                    SentryNode.Handlers.parseRequest(event, request.raw.req, options);

                    // use request credentials for capturing user
                    event.user = request.auth && request.auth.credentials;

                    if (event.user) {
                        Object.keys(event.user) // hide credentials
                            .filter((prop) => /^(p(ass)?w(or)?(d|t)?|secret)?$/i.test(prop))
                            .forEach((prop) => delete event.user[prop]);
                    }

                    return event;
                    /* $lab:coverage:on$ */
                });
            });

            return h.continue;
        });
    },
    name: 'hapi-sentry'
};
