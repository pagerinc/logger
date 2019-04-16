'use strict';

// Load modules

const { logger: Logger } = require('../lib');
const Code = require('code');
const Lab = require('lab');
const Stream = require('stream');

const internals = {};

// Test shortcuts

const lab = exports.lab = Lab.script();
const { afterEach, beforeEach, it, describe } = lab;
const expect = Code.expect;

describe('Logger', () => {

    beforeEach(() => {

        internals.queue = [];
        internals.destinationStream = new Stream.Writable({
            write: (chunk, encoding, next) => {

                internals.queue.push(JSON.parse(chunk.toString()));
                next();
            }
        });
        internals.nonJsonStream = new Stream.Writable({
            write: (chunk, encoding, next) => {

                internals.queue.push(chunk.toString());
                next();
            }
        });
    });

    afterEach(() => {

        delete internals.queue;
        delete internals.nonJsonStream;
    });

    it('should redact default fields with custom logger', () => {

        const logger = Logger.createLogger({ prettyPrint: false }, internals.destinationStream);
        logger.info({ password: 'my secret', other: 'asdf', headers: { authorization: 'what' } }, 'a message');
        expect(internals.queue).to.have.length(1);
        expect(internals.queue[0].password).to.equal('[Redacted]');
        expect(internals.queue[0].other).to.equal('asdf');
        expect(internals.queue[0].data).to.equal('a message');
        expect(internals.queue[0].headers.authorization).to.equal('[Redacted]');
    });

    it('should redact configured fields', () => {

        const logger = Logger.createLogger({ redact: ['someSecret'], prettyPrint: false }, internals.destinationStream);
        logger.info({ password: 'my secret', other: 'asdf', 'someSecret': '12345' });
        expect(internals.queue).to.have.length(1);
        expect(internals.queue[0].password).to.equal('[Redacted]');
        expect(internals.queue[0].someSecret).to.equal('[Redacted]');
        expect(internals.queue[0].other).to.equal('asdf');
    });

    it('should log pretty print on dev by default', () => {

        const logger = Logger.createLogger({ prettyPrint: true }, internals.nonJsonStream);
        logger.info({ this: { is: 'a' }, nested: { json: 'object', with: { many: { many: { many: 'levels' } } } } });
        expect(internals.queue).to.have.length(1);
        console.log(internals.queue[0]);
    });

    it('should log pretty print with additional args', () => {

        const logger = Logger.createLogger({ prettyPrint: { colorize: false } }, internals.nonJsonStream);
        logger.error({ this: { is: 'a' }, bad: { json: 'object', with: { many: { many: { many: 'levels' } } } } });
        expect(internals.queue).to.have.length(1);
        expect(() => JSON.parse(internals.queue[0])).to.throw(); // pretty print is not json
    });

    describe('Sentry', () => {

        beforeEach(() => {

            internals.scope = {
                setLevel: () => {}
            },
            internals.sentryQueue = [];
            internals.sentryStream = {
                withScope: (fn) => {

                    fn(internals.scope);
                },
                captureEvent: (event) => {

                    internals.sentryQueue.push(event);
                }
            };
        });

        afterEach(() => {

            delete internals.sentryQueue;
            delete internals.sentryStream;
        });

        it('should not trigger sentry on info', () => {

            const logger = Logger.createLogger({ prettyPrint: false, sentry: internals.sentryStream });
            logger.info('a non error log');
            expect(internals.sentryQueue).to.have.length(0);
        });

        it('should trigger sentry on error', () => {

            const logger = Logger.createLogger({ prettyPrint: false, sentry: internals.sentryStream });
            logger.error(new Error('test error'));
            expect(internals.sentryQueue).to.have.length(1);
        });

        it('should not crash on sentry log failures', () => {

            const sentry = {
                withScope: () => {

                    throw new Error('sentry issue');
                }
            };
            const logger = Logger.createLogger({ prettyPrint: false, sentry });
            logger.error(new Error('test error')); // if this passes, we captured the error correctly
        });
    });

    describe('env var testing', () => {

        beforeEach(() => {

            process.env.NODE_ENV = 'production';
        });

        it('should not default to pretty print if node env production', () => {

            const logger = Logger.createLogger({ }, internals.nonJsonStream);
            logger.info({ this: { is: 'a' }, large: { json: 'object', with: { many: { many: { many: 'levels' } } } } });
            expect(internals.queue).to.have.length(1);
            expect(JSON.parse(internals.queue[0]).large.with.many.many.many).to.equal('levels');
        });

        it('should pretty print if instructed and node env production', () => {

            const logger = Logger.createLogger({ prettyPrint: true }, internals.nonJsonStream);
            logger.info({ this: { is: 'a' }, large: { json: 'object', with: { many: { many: { many: 'levels' } } } } });
            expect(internals.queue).to.have.length(1);
            expect(() => JSON.parse(internals.queue[0])).to.throw(); // pretty print is not json
        });

        afterEach(() => {

            process.env.NODE_ENV = 'test';
        });
    });
});
