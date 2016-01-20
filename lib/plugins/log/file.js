/** @module plugins/log/file */
var fs = require('fs')

/**
 * Redirect process runner output to a file.
 * @function
 * @param {Object} opts - The options object.
 * @param {string} opts.name - The filename.
 * @param {string} [opts.input=output] - The stream input. Allowed values are "output", "stdout" and "stderr".
 * @param {Object} [opts.stream_options={}] - The {@link https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options fs.createStream} options.
 * @param {Function} errCb - The plugin error callback.
 * @param {module:CommandRunner~CommandRunner} runner - The command runner.
 */
module.exports = function(opts, errCb, runner) {
  if (!opts.name || opts.name.length == 0) {
    errCb(new Error('"name" option is missing or empty'))

    return
  }

  if (!opts.input || opts.input.length == 0) {
    // Default input is stdout with stderr
    opts.input = 'output'
  } else {
    if (-1 == ['output', 'stdout', 'stderr'].indexOf(opts.input)) {
      errCb(new Error('"input" option is invalid'))
    }
  }

  // fs.createStream default behavious is open file for writing.
  // The file is created (if it does not exist) or truncated (if it exists).
  // To append, just set stream_options to {flags: 'a'}
  if (!opts.stream_options) {
    opts.stream_options = {}
  }

  var stream = fs.createWriteStream(opts.name, opts.stream_options)
  if ((opts.input === 'output' || opts.input === 'stdout')) {
    runner.process().stdout.on('data', (chunk) => {
      stream.write(chunk)
    })
  }
  if ((opts.input === 'output' || opts.input === 'stderr')) {
    runner.process().stderr.on('data', (chunk) => {
      stream.write(chunk)
    })
  }
}
