'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const ReqSerializer = require('../lib/req-serializer');

const internals = {};

const lab = exports.lab = Lab.script();
const { afterEach, beforeEach, it, describe } = lab;
const expect = Code.expect;

describe('reqSerializer', () => {

    beforeEach(() => {

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
                },
                req: {
                    headers: {
                        'X-Correlation-Id': '1',
                        'X-Request-Id': '2'
                    }
                }
            }
        };
    });

    afterEach(() => {

        delete internals.req;
    });

    it('should return a subset of the hapi request object', () => {

        const req = ReqSerializer(internals.req);
        expect(req.path).to.exist();
        expect(req.route).to.exist();
        expect(req.httpVersion).to.exist();
        expect(req.instance).to.exist();
        expect(req.source).to.exist();
        expect(req.app).to.equal(undefined);
    });

    describe('requestId', () => {

        it('should use X-Correlation-Id header when present', () => {

            const req = ReqSerializer(internals.req);
            expect(req.requestId).to.equal('1');
        });

        it('should fallback to X-Request-Id when X-Correlation-Id not present', () => {

            const request = { ...internals.req };
            delete request.raw.req.headers['X-Correlation-Id'];

            const req = ReqSerializer(request);
            expect(req.requestId).to.equal('2');
        });

        it('should not include requestId when no headers found', () => {

            const request = { ...internals.req };
            delete request.raw.req;

            const req = ReqSerializer(request);
            console.log(req);
            expect(req.requestId).to.be.undefined();
        });
    });
});
