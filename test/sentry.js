'use strict';

// Load modules

const Sentry = require('../lib/sentry/index');
const Lab = require('lab');
const Code = require('code');
const Stream = require('../lib/sentry/stream');

// Test shortcuts

const lab = exports.lab = Lab.script();
const { it, describe } = lab;
const expect = Code.expect;

describe('Sentry', () => {

    it('should apply defaults without error', () => {

        let sentry = Sentry.generate();
        sentry.captureMessage({});

        sentry = Sentry.generate({ scope: { } });
        sentry.captureMessage({});

        sentry = Sentry.generate({ scope: { tags: [{ name: 'test', value: 'value' }] } });
        sentry.captureMessage({});

        sentry = Sentry.generate({ scope: { level: 'error' } });
        sentry.captureMessage({});

        sentry = Sentry.generate({ scope: { extra: { a: 'val1', b: 'val2' } } });
        sentry.captureMessage({});
    });

    it('should stream error', () => {

        let capturedEvent;
        const scope = {
            setExtras: () => {}
        };
        const hub = {
            withScope: (fn) => {

                fn(scope);
            },
            captureEvent: (event) => {

                capturedEvent = event;
            }
        };
        const sentry = {
            getCurrentHub: () => hub
        };

        const stream = Stream(sentry);

        return new Promise((resolve) => {

            const error = { err: new Error('test') };
            const next = () => {

                expect(capturedEvent).to.exist();
                resolve();
            };

            stream.write(JSON.stringify(error), null, next);
        });
    });
});
