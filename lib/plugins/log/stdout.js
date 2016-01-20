/** @module plugins/log/stdout */

/**
 * Redirect process runner stdout to main process stdout.
 * @function
 * @param {Object} opts - The options object.
 * @param {Function} errCb - The plugin error callback.
 * @param {module:CommandRunner~CommandRunner} runner - The command runner.
 */
module.exports = function(opts, errCb, runner) {
  // Signal async runner to pipe child stdout
  runner.emit('pipe_stdout', runner)
}
