'use strict';

const reqSerializer = function reqSerializer(req) {

    const { path, instance, route, httpVersion, source, req: request } = req.raw;

    if (request) {
        req.requestId = request.headers['X-Correlation-Id'] || request.headers['X-Request-Id'];
    }

    if (path) {
        req.path = path;
    }

    if (instance) {
        req.instance = instance;
    }

    if (route) {
        req.route = route;
    }

    if (httpVersion) {
        req.httpVersion = httpVersion;
    }

    if (source) {
        req.source = source;
    }

    return req;
};

module.exports = reqSerializer;
