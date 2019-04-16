'use strict';

// Load modules

const Sentry = require('../lib/sentry/index');
const Lab = require('lab');

// Test shortcuts

const lab = exports.lab = Lab.script();
const { it, describe } = lab;

describe('Sentry', () => {

    it('should apply defaults without error', () => {

        let sentry = Sentry();
        sentry.captureMessage({});

        sentry = Sentry({ scope: { } });
        sentry.captureMessage({});

        sentry = Sentry({ scope: { tags: [{ name: 'test', value: 'value' }] } });
        sentry.captureMessage({});

        sentry = Sentry({ scope: { level: 'error' } });
        sentry.captureMessage({});

        sentry = Sentry({ scope: { extra: { a: 'val1', b: 'val2' } } });
        sentry.captureMessage({});
    });
});
