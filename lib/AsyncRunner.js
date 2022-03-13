/** @module AsyncRunner */
var async = require('async')
var fs = require('fs')
var readline = require('readline')
var fmt = require('util').format
var CommandRunner = require('./CommandRunner')

/**
 * Create a new asynchronous runner.
 * @class
 * @param {(string|Object)} config - The configuration filename or object.
 */
var AsyncRunner = function(config) {
  this._setTrap()
  this._hasDebug = false
  this.load(config)
}

/**
 * Load the configuration.
 * @param {(string|Object)} config - The configuration filename or object.
 */
AsyncRunner.prototype.load = function(config) {
  this._commands = []

  if ('string' === typeof config) {
    config = this._readJsonFile(config)
  }

  try {
    for (var name in config) {
      this._commands.push(new CommandRunner(name, config[name]))
    }
  } catch (err) {
    this._abort(err.message)
  }
}

/**
 * Run all commands asynchronously.
 */
AsyncRunner.prototype.run = function() {
  var tasks = {}

  this._commands.forEach((command) => {
    tasks[command.name()] = command.task()
    command.on('spawn_process', (child) => {
      this._observe(child)
    })
    command.on('pipe_stderr', (cmd) => {
      cmd.process().stderr.pipe(process.stderr)
    })
    command.on('pipe_stdout', (cmd) => {
      cmd.process().stdout.pipe(process.stdout)
    })
  })

  async.auto(tasks, (err, results) => {
    if (err) {
      this._debug(fmt('Failed to spawn all command: %s', err.message), results)
      this._abort(err.message)

      return
    }
    this._debug('Successfully spawned all command')
  })
}

/**
 * Enable or disable debug messages.
 * @param {boolean} debug - Set to true to enable or false to disable.
 */
AsyncRunner.prototype.debug = function(debug) {
  this._hasDebug = (true === debug)
}

AsyncRunner.prototype._debug = function(msg) {
  if (this._hasDebug) {
    console.log(fmt('DEBUG: %s', msg))
  }
}

AsyncRunner.prototype._observe = function(child) {
  var opts = child.options()

  child.process().on('close', (code) => {
    if (code === 0) {
      if (opts.exit_on_success) {
        this._exit(fmt(
          '"%s" command has closed with code %s',
          child.name(),
          code
        ))
      }

      return
    }
    if (opts.abort_on_error) {
      this._abort(fmt(
        '"%s" command has closed with code %s',
        child.name(),
        code
      ))
    }
  })

  child.process().on('error', (err) => {
    if (opts.abort_on_error) {
      this._abort(fmt(
        'Failed to run "%s" command: %s',
        child.name(),
        err.message
      ))
    }
  })
}

AsyncRunner.prototype._abort = function(reason) {
  console.log(fmt('Runner aborted with error: %s', reason))
  process.exitCode = 1
  process.emit('SIGINT')
}

AsyncRunner.prototype._exit = function(reason) {
  this._debug(fmt('Runner exiting: %s', reason))
  process.emit('SIGINT')
}

AsyncRunner.prototype._readJsonFile = function(file) {
  try {
    return JSON.parse(fs.readFileSync(file))
  } catch (err) {
    this._abort(fmt(
      'Failed to read "%s" JSON file: %s',
      file,
      err.message
    ))
  }
}

AsyncRunner.prototype._kill = function(cb) {
  this._commands.forEach((command) => {
    if (command.process()) {
      command.process().kill('SIGTERM')
    }
  })
  cb()
}

AsyncRunner.prototype._setTrap = function() {
  if (process.platform === 'win32') {
    readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    }).on('SIGINT', function() {
      process.emit('SIGINT')
    })
  }

  process.on('exit', this._signalHandler.bind(this, {cleanup: true, event:'exit'}))
  process.on('SIGINT', this._signalHandler.bind(this, {exit: true, event:'SIGINT'}))
  process.on('SIGTERM', this._signalHandler.bind(this, {exit: true, event:'SIGTERM'}))
  process.on('uncaughtException', this._signalHandler.bind(this, {exit: true, event:'uncaughtException'}))
}

AsyncRunner.prototype._signalHandler = function(opts, err) {
  this._debug(fmt('_signalHandler called with %o', {opts: opts, err: err}));

  var exit = function() {
    if (err && err.stack) {
      console.log(err.stack)
    }
    if (opts.exit) {
      process.exit()
    }
  }

  if (opts.cleanup) {
    this._debug('Stopping all running commands ...')
    this._kill(exit)
    this._debug('All commands are stopped')
  } else {
    exit()
  }
}

module.exports = AsyncRunner
