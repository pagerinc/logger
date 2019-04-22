'use strict';

// Load modules

const { logger: Logger, plugin: Plugin } = require('../lib');
const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Stream = require('stream');
const Joi = require('joi');

const internals = {};

// Test shortcuts

const lab = exports.lab = Lab.script();
const { afterEach, beforeEach, it, describe } = lab;
const expect = Code.expect;

describe('Plugin', () => {

    beforeEach(async () => {

        const server = new Hapi.Server();
        const queue = [];
        internals.destinationStream = new Stream.Writable({
            write: (chunk, encoding, next) => {

                queue.push(JSON.parse(chunk.toString()));
                next();
            }
        });
        const instance = Logger.createLogger({ prettyPrint: false }, internals.destinationStream);
        await server.register({
            plugin: Plugin,
            options: {
                instance,
                pino: {
                    ignorePaths: ['/stanky-leg'],
                    prettyPrint: false
                }
            }
        });
        server.route([
            {
                method: 'GET',
                path: '/',
                handler: (request, h) => {

                    request.log(['info'], 'this is a request log');
                    return {};
                }
            },
            {
                method: 'GET',
                path: '/throw',
                handler: (request, h) => {

                    throw new Error('some error');
                }
            },
            {
                method: 'GET',
                path: '/throw-promise',
                handler: async (request, h) => {

                    await Promise.reject(new Error('some rejection'));
                }
            },
            {
                method: 'GET',
                path: '/stanky-leg',
                handler: (request, h) => {

                    return {};
                }
            }
        ]);

        internals.server = server;
        internals.queue = queue;
    });

    afterEach(() => {

        delete internals.queue;
    });

    it('should log a server request', () => {

        internals.server.log(['info'], 'test');
        expect(internals.queue).to.have.length(1); // server start log
        expect(internals.queue[0].data).to.equal('test');
    });

    it('should log a request', async () => {

        const request = {
            method: 'GET',
            url: '/'
        };
        const response = await internals.server.inject(request);

        expect(response.statusCode).to.equal(200);
        expect(internals.queue).to.have.length(2); // request complete log
        expect(internals.queue[0].data).to.equal('this is a request log');
    });

    it('should log an error', async () => {

        const request = {
            method: 'GET',
            url: '/throw'
        };
        const response = await internals.server.inject(request);

        expect(response.statusCode).to.equal(500);
        expect(internals.queue).to.have.length(2);
        expect(internals.queue[0].err.message).to.equal('some error');
        expect(internals.queue[0].err.stack).to.exist();
    });

    it('should log an error', async () => {

        const request = {
            method: 'GET',
            url: '/throw-promise'
        };
        const response = await internals.server.inject(request);

        expect(response.statusCode).to.equal(500);
        expect(internals.queue).to.have.length(2);
        expect(internals.queue[0].err.message).to.equal('some rejection');
        expect(internals.queue[0].err.stack).to.exist();
    });

    it('should not log ignored paths', async () => {

        const request = {
            method: 'GET',
            url: '/stanky-leg'
        };
        const response = await internals.server.inject(request);

        expect(response.statusCode).to.equal(200);
        expect(internals.queue).to.have.length(0);
    });

    it('should use default logger if none supplied without error', async () => {

        const server = new Hapi.Server();
        await server.register({
            plugin: Plugin,
            options: { pino: { prettyPrint: false }, sentry: { sentry: {} } }
        });
        server.log(['info'], 'stdout log');
        server.log(['info'], { test: 'my test object' });
    });

    it('should return an error if configured', async () => {

        const server = new Hapi.Server();

        server.route({
            method: 'GET',
            path: '/throw-promise',
            handler: async (request, h) => {

                await Promise.reject(new Error('some rejection'));
            }
        });
        const queue = [];
        await server.register({
            plugin: Plugin,
            options: {
                exposeErrors: true,
                instance: Logger.createLogger({ prettyPrint: false }, new Stream.Writable({
                    write: (chunk, encoding, next) => {

                        queue.push(JSON.parse(chunk.toString()));
                        next();
                    }
                }))
            }
        });

        const request = {
            method: 'GET',
            url: '/throw-promise'
        };

        const response = await server.inject(request);
        const payload = JSON.parse(response.payload);

        expect(response.statusCode).to.equal(500);
        expect(payload.details.message).to.equal('some rejection');
        expect(payload.details.stack).to.exist();
    });

    it('should not affect non-500 in this plugin', async () => {

        const server = new Hapi.Server();

        server.route({
            method: 'POST',
            path: '/validated',
            config: {
                handler: (request, h) => 1,
                validate: {
                    payload: {
                        key: Joi.number().integer()
                    }
                }
            }
        });
        const queue = [];
        await server.register({
            plugin: Plugin,
            options: {
                exposeErrors: true,
                instance: Logger.createLogger({ prettyPrint: false }, new Stream.Writable({
                    write: (chunk, encoding, next) => {

                        queue.push(JSON.parse(chunk.toString()));
                        next();
                    }
                }))
            }
        });

        const request = {
            method: 'POST',
            url: '/validated',
            payload: {
                key: 'not a number'
            }
        };

        let response = await server.inject(request);
        let payload = JSON.parse(response.payload);
        expect(response.statusCode).to.equal(400);
        expect(payload.details).to.not.exist();

        request.payload.key = 1;
        response = await server.inject(request);
        payload = JSON.parse(response.payload);
        expect(response.statusCode).to.equal(200);
        expect(payload.details).to.not.exist();
    });
});
