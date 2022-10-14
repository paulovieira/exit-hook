'use strict';

const callbacks = new Set();
let isCalled = false;
let isRegistered = false;

function exit(originalEvent, exit, exitCode, err) {
	if (isCalled) {
		return;
	}

	isCalled = true;

	// console.log('exit-hook', { originalEvent, exit, exitCode, err })

	if (err instanceof Error) {
		console.error(err.stack);
	}

	for (const callback of callbacks) {
		callback(originalEvent);
	}

	if (exit === true) {
		console.log(`exit-hook: process.exit(${exitCode})`)
		process.exit(exitCode); // eslint-disable-line unicorn/no-process-exit
	}
}

module.exports = callback => {
	callbacks.add(callback);

	if (!isRegistered) {
		isRegistered = true;

		process.once('exit', exit.bind(null, 'exit'));
		process.once('beforeExit', exit.bind(null, 'beforeExit'));
		process.once('SIGINT', exit.bind(null, 'SIGINT', true, 2 + 128));
		process.once('SIGTERM', exit.bind(null, 'SIGTERM', true, 15 + 128));
		process.once('uncaughtException', exit.bind(null, 'uncaughtException', true, 1));
		process.once('unhandledRejection', exit.bind(null, 'unhandledRejection', true, 1));

		// PM2 Cluster shutdown message. Caught to support async handlers with pm2, needed because
		// explicitly calling process.exit() doesn't trigger the beforeExit event, and the exit
		// event cannot support async handlers, since the event loop is never called after it.

		// process.on('message', message => {
		//   if (message === 'shutdown') {
		//     exit('message', true, -128);
		//   }
		// });
	}

	return () => {
		callbacks.delete(callback);
	};
};
