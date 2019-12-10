'use strict';

// Load modules

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { reqSerializer } = require('../lib/req-serializer');

const internals = {};

// Test shortcuts

const lab = exports.lab = Lab.script();
const { after, before, it, describe } = lab;
const expect = Code.expect;

describe('reqSerializer', () => {

    before(() => {

        internals.req = {
            raw: {
                app: 'api-core',
                path: '/logout',
                route: '/logout',
                httpVersion: '1.1',
                instance: 'http://dev-api-core-57877965c5-sfvzc:3000',
                source: {
                    remoteAddress: '10.4.2.133',
                    userAgent: 'ExampleInternal/1.9.0.internal-3 (iPhone; iOS 12.2; Scale/2.00)'
                }
            }
        };
    });

    after(() => {

        delete internals.req;
    });

    it('should return a subset of the hapi request object', () => {

        const req = reqSerializer(internals.req);
        expect(req.app).to.equal(undefined);
    });
});
