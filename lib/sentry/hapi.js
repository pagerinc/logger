'use strict';

const Hoek = require('hoek');
const SentryNode = require('@sentry/node');
const Sentry = require('.');
const Joi = require('joi');
const { HapiSentrySchema } = require('./schema');

module.exports = {
    register: (server, options) => {

        const opts = Joi.attempt(options, HapiSentrySchema, 'Invalid hapi-sentry options:');
        let sentry = options.sentry;
        if (!sentry) {
            sentry = Sentry(opts);
        }

        // expose sentry client at server.plugins['hapi-sentry'].client
        server.expose('client', sentry);

        // attach a new scope to each request for breadcrumbs/tags/extras/etc capturing
        server.ext('onRequest', (request, h) => {

            request.sentryScope = new SentryNode.Scope();
            return h.continue;
        });

        // catch request errors/warnings/etc (default: only errors) and capture them with sentry
        server.events.on({ name: 'request', channels: options.channels }, async (request, event) => {

            // format a sentry event from the request and triggered event
            const sentryEvent = await SentryNode.Parsers.parseError(event.error);
            SentryNode.Handlers.parseRequest(sentryEvent, request.raw.req);

            // overwrite events request url if a baseUrl is provided
            if (opts.baseUri) {
                if (opts.baseUri.slice(-1) === '/') {
                    opts.baseUri = opts.baseUri.slice(0, -1);
                }

                sentryEvent.request.url = opts.baseUri + request.path;
            }

            // set severity according to the filters channel
            sentryEvent.level = event.channel;

            // use request credentials for capturing user
            if (opts.trackUser) {
                sentryEvent.user = request.auth && request.auth.credentials;
            }

            if (sentryEvent.user) {
                Object.keys(sentryEvent.user) // hide credentials
                    .filter((prop) => /^(p(ass)?w(or)?(d|t)?|secret)?$/i.test(prop))
                    .forEach((prop) => delete sentryEvent.user[prop]);
            }

            // @sentry/node.captureEvent does not support scope parameter, if it's not from Sentry.Hub(?)
            sentry.withScope((scope) => { // thus use a temp scope and re-assign it

                Hoek.applyToDefaults(scope, request.sentryScope);
                sentry.captureEvent(sentryEvent);
            });
        });
    },
    name: 'hapi-sentry'
};
