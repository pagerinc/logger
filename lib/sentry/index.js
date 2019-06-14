'use strict';

const { SentrySchema } = require('./schema');
const Sentry = require('@sentry/node');
const Joi = require('@hapi/joi');

const internals = {
    generate: (options = {}) => {

        const opts = Joi.attempt(options, SentrySchema, 'Invalid sentry options:');

        // initialize sentry client
        Sentry.init(opts.client);

        // initialize global scope if set via plugin options
        if (opts.scope) {
            Sentry.configureScope((scope) => {

                if (opts.scope.tags) {
                    opts.scope.tags.forEach((tag) => scope.setTag(tag.name, tag.value));
                }

                if (opts.scope.level) {
                    scope.setLevel(opts.scope.level);
                }

                if (opts.scope.extra) {
                    Object.keys(opts.scope.extra).forEach((key) => scope.setExtra(key, opts.scope.extra[key]));
                }
            });
        }

        return Sentry;
    }
};

const _sentry = internals.generate();

module.exports = {
    generate: internals.generate,
    default:  _sentry
};
