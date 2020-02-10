/** @module utils/waitForSocket */
const net = require('net')

const SOCKET_CONNECT_INTERVAL = 200
const SOCKET_CONNECT_TIMEOUT = 10000

/**
 * The wait for socket callback.
 * @callback module:waitForSocket~waitCallback
 * @param {(Error|undefined)} err - The error if connection failed.
 */

/**
 * Wait for a socket to be available.
 * @function waitForSocket
 * @param {Object} options - The options object.
 * @param {number} options.port - The port number.
 * @param {string} [options.host=localhost] - The host name.
 * @param {number} [options.timeout=10000] - The connect timeout in milliseconds.
 * @param {number} [options.interval=200] - The connect retry interval in milliseconds.
 * @param {module:waitForSocket~waitCallback} callback - The callback called when socket is available.
 * @throws Will throw an error if port option is missing.
 * @throws Will throw an error if the callback is not a function.
 * @example
 * waitForSocket({host: '127.0.0.1', port: 8000}, function(err) {
 *   if (err) {
 *     console.log(err)
 *     return
 *   }
 *
 *   console.log('Socket is available')
 * })
 */
module.exports = (options, callback) => {
  var timeout = options.timeout || SOCKET_CONNECT_TIMEOUT
  var interval = options.interval || SOCKET_CONNECT_INTERVAL
  var host = options.host || 'localhost'
  var connectTimer
  var timeoutTimer

  if (!options.port) {
    callback(new Error('Port option is missing'))

    return
  }

  if ('function' !== typeof callback) {
    callback(new Error('Callback must be a function'))

    return
  }

  function connect() {
    const socket = new net.Socket()
      .on('error', function() {
        socket.destroy()
        connectTimer = setTimeout(connect, interval)
      })
      .on('connect', function() {
        clearTimeout(connectTimer)
        clearTimeout(timeoutTimer)
        socket.end()
        callback()
      })
      .connect(options.port, host)
  }

  timeoutTimer = setTimeout(function() {
    clearTimeout(connectTimer)
    callback(new Error('Socket connection timed out'))
  }, timeout)

  connect()
}
