/** @module plugins/wait/timer */

/**
 * Wait for a timer duration.
 * @function
 * @param {Object} opts - The options object.
 * @param {number} opts.duration - The wait duration in milliseconds. Must be greater than or equal to 100.
 * @param {Function} cb - The plugin callback.
 * @param {module:CommandRunner~CommandRunner} runner - The command runner.
 */
module.exports = function(opts, cb, runner) {
  // Duration option must be at least 100 milliseconds
  if (!opts.duration || opts.duration < 100) {
    cb(new Error('Duration option is missing or invalid'))

    return
  }
  setTimeout(() => { cb() }, opts.duration)
}
