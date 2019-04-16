'use strict';

const Stream = require('stream');

module.exports = (sentry) => {

    return new Stream.Writable({
        write: (chunk, encoding, next) => {

            try {
                sentry.withScope((scope) => {

                    const parsedEvent = JSON.parse(chunk.toString());
                    scope.setLevel('error');
                    sentry.captureEvent({
                        message: parsedEvent.data,
                        extra: parsedEvent
                    });
                });
            }
            catch (err) {
                // Don't crash on parsing errors
                console.error('Error writing sentry stream!');
                console.error(err);
            }

            next();
        }
    });
};
