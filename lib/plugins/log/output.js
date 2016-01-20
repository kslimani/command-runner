/** @module plugins/log/output */

/**
 * Redirect process runner output to main process output.
 * @function
 * @param {Object} opts - The options object.
 * @param {Function} errCb - The plugin error callback.
 * @param {module:CommandRunner~CommandRunner} runner - The command runner.
 */
module.exports = function(opts, errCb, runner) {
  // Signal async runner to pipe child stderr and stdout
  runner.emit('pipe_stderr', runner)
  runner.emit('pipe_stdout', runner)
}
