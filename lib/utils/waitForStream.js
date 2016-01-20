/** @module utils/waitForStream */
const DEFAULT_TIMEOUT = 10000

/**
 * The wait for stream callback.
 * @callback module:waitForStream~waitCallback
 * @param {(Error|undefined)} err - The error if connection failed.
 */

/**
 * Wait for stream(s) to match a string.
 * @function waitForStream
 * @param {Object} options - The options object.
 * @param {Array.<Stream>} options.streams - The stream(s) to parse.
 * @param {string} options.match - The string to match.
 * @param {number} [options.timeout=10000] - The wait timeout in milliseconds.
 * @param {module:waitForStream~waitCallback} callback - The callback called when string matches.
 * @throws Will throw an error if streams option is missing or invalid.
 * @throws Will throw an error if match option is missing or invalid.
 * @throws Will throw an error if the callback is not a function.
 * @example
 * waitForStream({streams: [process.stdout, process.stderr], match: 'foobar'}, function(err) {
 *   if (err) {
 *     console.log(err)
 *     return
 *   }
 *
 *   console.log('Foobar has matched')
 * })
 */
module.exports = (options, callback) => {
  var timeout = options.timeout || DEFAULT_TIMEOUT
  var timeoutTimer
  var buffer = ''

  if (!options.streams || options.streams.length == 0) {
    callback(new Error('Streams option is missing or invalid'))

    return
  }

  if (!options.match || options.match.length == 0) {
    callback(new Error('Match option is missing or invalid'))

    return
  }

  if ('function' !== typeof callback) {
    callback(new Error('Callback must be a function'))

    return
  }

  function onData(data) {
    buffer += data
    if (buffer.indexOf(options.match) !== -1) {
      clearTimeout(timeoutTimer)
      options.streams.forEach(function(stream) {
        stream.removeListener('data', onData)
      })
      callback()
    }
  }

  timeoutTimer = setTimeout(function() {
    callback(new Error('Streams match timed out'))
  }, timeout)

  options.streams.forEach(function(stream) {
    stream.on('data', onData)
  })
}
