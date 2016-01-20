/** @module plugins/wait/output */
var waitForStream = require('../../utils/waitForStream')

/**
 * Wait for an output string. (stdout and stderr).
 * @function
 * @param {Object} opts - The options object.
 * @param {string} opts.match - The string to match.
 * @param {number} [opts.timeout=10000] - The wait timeout in milliseconds.
 * @param {Function} cb - The plugin callback.
 * @param {module:CommandRunner~CommandRunner} runner - The command runner.
 */
module.exports = function(opts, cb, runner) {
  opts.streams = [
    runner.process().stdout,
    runner.process().stderr,
  ]
  waitForStream(opts, function(err) {
    if (err) {
      cb(err)

      return
    }
    cb()
  })
}
