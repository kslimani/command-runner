/** @module plugins/wait/done */

/**
 * Wait for a process to run and exit with success code.
 * @function
 * @param {Object} opts - The options object.
 * @param {number} [opts.timeout] - The wait timeout in milliseconds. Must be greater than or equal to 100.
 * @param {Function} cb - The plugin callback.
 * @param {module:CommandRunner~CommandRunner} runner - The command runner.
 */
module.exports = function(opts, cb, runner) {
  var timeoutTimer

  if (opts.timeout) {
    // Timeout option must be at least 100 milliseconds
    if (opts.timeout < 100) {
      cb(new Error('Timeout option is invalid'))

      return
    }

    timeoutTimer = setTimeout(function() {
      cb(new Error('Process run timed out'))
    }, opts.timeout)
  }

  runner.process().on('close', (code) => {
    clearTimeout(timeoutTimer)
    if (code === 0) {
      cb()
    }
  })
}
