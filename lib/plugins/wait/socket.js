/** @module plugins/wait/socket */
var waitForSocket = require('../../utils/waitForSocket')

/**
 * Wait for a socket.
 * @function
 * @param {Object} opts - The options object.
 * @param {number} opts.port - The port number.
 * @param {string} [opts.host=localhost] - The host name.
 * @param {number} [opts.timeout=10000] - The connect timeout in milliseconds.
 * @param {number} [opts.interval=200] - The connect retry interval in milliseconds.
 * @param {Function} cb - The plugin callback.
 * @param {module:CommandRunner~CommandRunner} runner - The command runner.
 */
module.exports = function(opts, cb, runner) {
  waitForSocket(opts, function(err) {
    if (err) {
      cb(err)

      return
    }
    cb()
  })
}
