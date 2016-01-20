/** @module plugins/log/stderr */

/**
 * Redirect process runner stderr to main process stderr.
 * @function
 * @param {Object} opts - The options object.
 * @param {Function} errCb - The plugin error callback.
 * @param {module:CommandRunner~CommandRunner} runner - The command runner.
 */
module.exports = function(opts, errCb, runner) {
  // Signal async runner to pipe child stderr
  runner.emit('pipe_stderr', runner)
}
