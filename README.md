# logger
[![Circle CI](https://circleci.com/gh/pagerinc/logger.svg?style=svg&circle-token=5d187ad739918f3029e28534e5bf046ece8120ae)](https://circleci.com/gh/pagerinc/logger)

Logging library for your verbose projects.


## Basic usage

Works as both a service worker logger or a Hapi plugin - both of which use standardized formatting and redaction configuration. For more details on how to work with Pino, take a look at [its documentation](https://github.com/pinojs/pino) or see [configuration](#Configuration) below for the setup details.

### Redacting

This library has been set up with an array of standard redactions based on current usage. Each app should explicitly append and detail all potential leaks. There are no wildcard defaults because there are associated performance issues with wildcards, particularly intermediate wildcards. Please do your part in log security to ensure no PHI or secrets are leaked into the logs.

## Pretty-print

Pretty print is auto-set to true when `NODE_ENV` is not `production` - which excludes any hosted pager environment which sets that to default. So any local development or test logs will include pretty-print auto-configured. To manually turn this off for any reason, set prettyPrint in pino options below according to the [prettyPrint docs](https://service.us2.sumologic.com/ui/#/search/TKLEGtyjj7TNZS7ZVIJGNFRER6VFdTUVT9ksS6G5).

Example:
```javascript
const { logger: Logger } = require('@pager/logger');
const MyCustomPrettyPrintLogger = logger.createLogger({ prettyPrint: { colorize: false } });
MyCustomPrettyPrintLogger.info('pretty print me please');
```

### Configuration

*Non-hapi*:
```javascript
{
  "level": "warn", // any pino default option overrides
  "redact": ['redactKey']
}
```

#### pino options
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

#### pino (Object)
Pino configuration object per [Pino's documentation](https://github.com/pinojs/pino/blob/master/docs/api.md#options-object)

#### instance (pino object)
Already configured pino object

#### exposeErrors (boolean)
Return error and stacktrace along with `500` response as a payload. Useful in non-production environments.
_Default: false_

## Installation and Usage

*Non-Hapi*
```javascript
// importing default logger is best practice for most cases
const { default: Logger } = require('@pager/logger/lib/logger');

Logger.info('Worker log');

// .. worker works ...
try {
    // do work
}
catch (err) {
    Logger.error(err);
}

process.on('unhandledRejection', (err) => {

    Logger.error(err);
});

```

*Hapi*
```javascript
const Hapi = require('hapi');
const { plugin: PinoPlugin } = require('@pagerinc/logger');

const server = new Hapi.Server();
await server.register(PinoPlugin);

server.log(['info'], { request: 'please log', response: 'hapi logging ^_^' });
// result: `{"level":30,"time":1550778694025,"pid":74042,"hostname":"securitys-MacBook-Pro.local","tags":["info"],"data":{"request":"please log","response":"hapi logging ^_^"},"v":1}`
```