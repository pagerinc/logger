'use strict';

const reqSerializer = function reqSerializer(req) {

    const { path, instance, route, httpVersion, source } = req.raw;

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
        req.httpVersion;
    }

    if (source) {
        req.source = source;
    }

    return req;
};

module.exports = {
    reqSerializer
};
