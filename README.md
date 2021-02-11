# @pager/logger
[![Circle CI](https://circleci.com/gh/pagerinc/logger.svg?style=svg&circle-token=5d187ad739918f3029e28534e5bf046ece8120ae)](https://circleci.com/gh/pagerinc/logger)

Structured logging for your verbose projects.
- Pino
- Hapi Plugin
- Global default

## Basic usage

Works as both a service worker logger or a Hapi plugin - both of which use standardized formatting and redaction configuration. For more details on how to work with Pino, take a look at [its documentation](https://github.com/pinojs/pino) or see [configuration](#Configuration) below for the setup details.

### Redacting

This library has been set up with an array of standard redactions based on current usage. Each app should explicitly append and detail all potential leaks. There are no wildcard defaults because there are large associated performance issues with wildcards, particularly intermediate wildcards. Please do your part in log security to ensure no PHI or secrets are leaked into the logs; defaults provided in the code are append only.

## Environment

| Name | Default | Description |
|------|---------|-------------|
| LOG_LEVEL | `info` | Lowest level to log in this order: `trace`, `debug`, `info`, `warn`, `error`, `fatal` |
| LOG_ERROR_THRESHOLD | `error` | Lowest error to send to error transport |
| LOG_PRETTY_PRINT | _none_ | Set to `1` to enable pretty print - this is *not* json and follows the configuration for [prettyPrint docs](https://github.com/pinojs/pino-pretty#pino-pretty) |

*Non-hapi*:
```javascript
{
  "level": "warn", // any pino default option overrides
  "redact": ['redactKey']
}
```

### pino options
Pino default overrides per [Pino's documentation](https://github.com/pinojs/pino/blob/master/docs/api.md#options-object).

*Hapi*
```javascript
{
  "pino":  { // pino default overrides that matches Pino's configuration documentation
    "base": {
      "version": "v1.0.2" // adds `version: 'v1.0.2'` to every log
    }
  },
  "instance": customPinoInstance, // optionally, an already configured pino instance,
  "exposeErrors": true
}
```

### pino (Object)
Pino configuration object per [Pino's documentation](https://github.com/pinojs/pino/blob/master/docs/api.md#options-object)

### instance (pino object)
Already configured pino object

## Installation and Usage

*Hapi*

For 90% of projects, there will be no configuration needed, the plugin will do all the heavy lifting, and you can use the existing hapi `server.log` and `request.log` that you know and love. You can extract the logging instance for injection by `server.logger` function or the `require.logger` object - see [Hapi Pino docs](https://github.com/pinojs/hapi-pino#server-decorations) for details.

```javascript
const Hapi = require('hapi');
const LogPlugin = require('@pager/logger/lib/plugin');

const server = new Hapi.Server();
await server.register(LogPlugin);

server.log(['info'], { request: 'please log', response: 'hapi logging ^_^' });

/*
{
    "level": 30,
    "time": 1550778694025,
    "pid": 74042,
    "hostname": "securitys-MacBook-Pro.local",
    "tags": ["info"],
    "data": {
        "request": "please log",
        "response": "hapi logging ^_^"
    },
    "v": 1
}
*/
```

*Non-Hapi*
```javascript
// injecting a logger is best practice for most cases, defaulting to singleton is acceptable
const Logger = require('@pager/logger');

module.exports = (logger = Logger) => {

    Logger.info('Worker log');

    // .. worker works ...
    try {
        // do work
    }
    catch (err) {
        logger.error(err);
    }
};
```

*Custom*
```javascript
const Logger = require('@pager/logger/lib/logger');
const MyCustomPrettyPrintLogger = Logger.createLogger({ prettyPrint: { colorize: false } });
MyCustomPrettyPrintLogger.info('pretty print me please');
```

### Accessing Log Streams Directly

Hapi provides several request lifecycle extension points which can be used to access request and response streams directly.

Keep in mind this is highly discouraged for production environments and typically comes at the expense of the app's performance.

For example, if you need access to a more detailed error trace when debugging, you can bypass any redacted fields by attaching directly to the `onPreResponse` event, eg:


```javascript
/// Return error and stacktrace along with `500` response as a payload.

// **Do not use this on production environments,**

server.ext('onPreResponse', (request, h) => {

    if (request.response.isBoom && request.response.output.statusCode >= 500) {
        request.response.output.payload.details = {
            message: request.response.message,
            url: request.url.path,
            headers: Hoek.clone(request.raw.req.headers),
            stack: request.response.stack
        };
    }

    return h.continue;
});
```

### Error handling

Under the hood we are using pino's [default error serializer](https://github.com/pinojs/pino-std-serializers/blob/master/lib/err.js). This means it will add extra keys on the error object if present, and are not already used by one of pino's preset keys (e.g. `data`, `message`, `type`, etc.).

For example, see the custom field `context` within the error and it's expected log output:
```javascript

const entity = { id: '6025827b568bb78e64b83ba2' };
const error = new Error('my error title');
error.context = { entityId: entity.id };
Logger.error(error);
/* Prints something like:
  {
    "level": 50,
    "time": 1613070971891,
    "pid": 58541,
    "hostname": "hostMBP",
    "context": {
      "entityId": "6025827b568bb78e64b83ba2"
    },
    "stack": "Error: my error title\n    at /projects/edge-api-cc/test/custom-error.js:19:23\n    at Immediate._onImmediate (/projects/edge-api-cc/node_modules/@hapi/lab/lib/runner.js:661:35)\n    at processImmediate (internal/timers.js:461:21)",
    "type": "Error",
    "data": "my error title"
  }
*/
```
