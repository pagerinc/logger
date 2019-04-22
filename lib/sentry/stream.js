'use strict';

const Stream = require('stream');
const Parsers = require('@sentry/node/dist/parsers');
const { addExceptionTypeValue } = require('@sentry/utils/dist/index');

module.exports = (sentry) => {

    return new Stream.Writable({
        write: (chunk, encoding, next) => {

            try {
                const parsedEvent = JSON.parse(chunk.toString());

                sentry.getCurrentHub().withScope((scope) => {

                    scope.setExtras(parsedEvent);

                    if (!parsedEvent.err) {
                        parsedEvent.name = parsedEvent.message = parsedEvent.data;
                    }

                    Parsers.parseError(parsedEvent.err || parsedEvent).then((event) => {

                        addExceptionTypeValue(event);
                        event.extra = { err: parsedEvent.err };
                        sentry.getCurrentHub().captureEvent(event);
                        next();
                    });
                });
            }
            catch (err) {
                // Don't crash on parsing errors
                console.error('Error writing sentry stream!');
                console.error(err);

                next();
            }
        }
    });
};
