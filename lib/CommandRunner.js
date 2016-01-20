/** @module CommandRunner */
var EventEmitter = require('events').EventEmitter
var fs = require('fs')
var spawn = require('child_process').spawn
var util = require('util')
var logFilePlugin = require('./plugins/log/file')
var logOutputPlugin = require('./plugins/log/output')
var logStdoutPlugin = require('./plugins/log/stdout')
var logStderrPlugin = require('./plugins/log/stderr')
var waitOutputPlugin = require('./plugins/wait/output')
var waitSocketPlugin = require('./plugins/wait/socket')
var waitTimerPlugin = require('./plugins/wait/timer')

const fmt = util.format

/**
 * Create a new command runner.
 * @class
 * @param {string} name - The command runner name.
 * @param {Object} options - The command runner options.
 * @throws Will throw an error if bad options.
 */
var CommandRunner = function(name, options) {
  EventEmitter.call(this)
  this._plugins = {log: {}, wait: {}}
  this._addDefaultPlugins()
  this._name = name
  this._options = this._buildOptions(options)
  this._task = this._buildAsyncTask(this._options)
}

// CommandRunner extends EventEmitter
util.inherits(CommandRunner, EventEmitter)

CommandRunner.prototype._addDefaultPlugins = function() {
  this.addPlugin('log', 'file', logFilePlugin)
  this.addPlugin('log', 'output', logOutputPlugin)
  this.addPlugin('log', 'stderr', logStderrPlugin)
  this.addPlugin('log', 'stdout', logStdoutPlugin)

  this.addPlugin('wait', 'output', waitOutputPlugin)
  this.addPlugin('wait', 'socket', waitSocketPlugin)
  this.addPlugin('wait', 'timer', waitTimerPlugin)
}

/**
 * Add a plugin.
 * @param {string} type - The plugin type. Allowed values are "log" and "wait".
 * @param {string} name - The plugin name. Must be unique per type.
 * @param {Function} plugin - The plugin.
 * @throws Will throw an error if plugin type is unknown.
 */
CommandRunner.prototype.addPlugin = function(type, name, plugin) {
  if (-1 === ['log', 'wait'].indexOf(type)) {
    throw new Error(fmt(
      'Unknown plugin type: %s',
      type
    ))
  }
  this._plugins[type][name] = plugin
}

/**
 * Get command runner name.
 * @return {string} The name.
 */
CommandRunner.prototype.name = function() {
  return this._name
}

/**
 * Get command runner options.
 * @return {Object} The options.
 */
CommandRunner.prototype.options = function() {
  return this._options
}

/**
 * Get the spawned child process.
 * @return {(ChildProcess|undefined)} The child process or undefined if not spawned yet.
 */
CommandRunner.prototype.process = function() {
  return this._process
}

/**
 * Get Async library compliant task.
 * @return {(Function|Array)} The task.
 */
CommandRunner.prototype.task = function() {
  return this._task
}

CommandRunner.prototype._buildOptions = function(options) {
  // "cmd" option is required.
  if (!options.hasOwnProperty('cmd')) {
    throw new Error(fmt(
      '"%s" command options is missing "cmd" property',
      this._name
    ))
  }

  // "cmd" option must be non empty.
  if (options.cmd.length == 0) {
    throw new Error(fmt(
      '"%s" command options "cmd" is empty',
      this._name
    ))
  }

  // Convert "cmd" to Array if string
  if ('string' === typeof options.cmd) {
    options.cmd = [options.cmd]
  }

  // Default is to not exit runner if a children process terminate with zero exit code.
  if (!options.hasOwnProperty('exit_on_success')) {
    options.exit_on_success = false
  }

  // Default is to abort runner if a children process terminate with non zero exit code.
  if (!options.hasOwnProperty('abort_on_error')) {
    options.abort_on_error = true
  }

  if (options.hasOwnProperty('log')) {
    // "log" option require at least a "type"
    if (!options.log.hasOwnProperty('type') || options.log.type.length == 0) {
      throw new Error(fmt(
        '"%s" command options log type is missing or empty',
        this._name
      ))
    }
    if (!options.log.hasOwnProperty('options')) {
      options.log.options = {}
    }
  }

  if (options.hasOwnProperty('wait')) {
    // "wait" option require at least a "type"
    if (!options.wait.hasOwnProperty('type') || options.wait.type.length == 0) {
      throw new Error(fmt(
        '"%s" command options wait type is missing or empty',
        this._name
      ))
    }
    if (!options.wait.hasOwnProperty('options')) {
      options.wait.options = {}
    }
  }

  // "depends" option must be an array of names of command dependencies.
  if (options.hasOwnProperty('depends')) {
    if (!Array.isArray(options.depends)) {
      throw new Error(fmt(
        '"%s" command options "depends" must be an Array',
        this._name
      ))
    }
  }

  return options
}

CommandRunner.prototype._once = function(cb) {
  var called = false

  // Wrap callback and ensure it is called only once
  return function() {
    if (!called) {
      called = true
      cb.apply(null, arguments)
    }
  }
}

CommandRunner.prototype._run = function(cb) {
  if (!this._options.cwd) {
    // Spawn child process using current working directory
    this._spawn(cb)

    return
  }
  // Check command working directory
  fs.stat(this._options.cwd, (err, stats) => {
    if (err) {
      cb(new Error(fmt(
        '"%s" command "cwd" not found: %s',
        this._name,
        this._options.cwd
      )))

      return
    }
    if (!stats.isDirectory()) {
      cb(new Error(fmt(
        '"%s" command "cwd" is not a directory: %s',
        this._name,
        this._options.cwd
      )))

      return
    }
    this._spawn(cb)
  })
}

CommandRunner.prototype._spawn = function(cb) {
  var args = this._options.cmd
  var cmd = args.shift()
  var spawnOpts = {}

  // Check if command has custom working directory
  if (this._options.cwd) {
    spawnOpts.cwd = this._options.cwd
  }

  // Run the command in a child process
  this._process = spawn(cmd, args, spawnOpts)
  this.emit('spawn_process', this)

  this._process.on('close', (code) => {
    if (code !== 0) {
      cb(new Error(fmt(
        '"%s" command has closed with code %s',
        this._name,
        code
      )))

      return
    }
  })

  this._process.on('error', (err) => {
    cb(new Error(fmt(
      'Failed to run "%s" command: %s',
      this._name,
      err.message
    )))
  })

  // Check if command has log option
  if (this._options.hasOwnProperty('log')) {
    this._setupLog(this._options.log, (err) => {
      if (err) {
        cb(new Error(fmt('"%s" command error: %s', this._name, err.message)))
      }
    })
  }

  // Check if command has wait option
  if (this._options.hasOwnProperty('wait')) {
    this._wait(this._options.wait, (err) => {
      if (err) {
        cb(new Error(fmt('"%s" command error: %s', this._name, err.message)))

        return
      }
      cb()
    })
  } else {
    // No wait: immediately run task callback.
    // May be called BEFORE 'close' and 'error' event callback.
    cb()
  }
}

CommandRunner.prototype._buildAsyncTask = function() {
  // Async library compliant task function
  // For more details, see https://github.com/caolan/async#auto
  var task = (cb, results) => {
    this._run(this._once(cb))
  }

  // Check if task has requirements
  var asyncTask
  if (this._options.hasOwnProperty('depends')) {
    asyncTask = this._options.depends
    asyncTask.push(task)
  } else {
    asyncTask = task
  }

  return asyncTask
}

CommandRunner.prototype._wait = function(wait, cb) {
  // Load matching "wait" plugin
  for (var handledType in this._plugins.wait) {
    if (wait.type === handledType) {
      this._plugins.wait[handledType](wait.options, (err) => {
        if (err) {
          cb(err)
          return
        }
        cb()
      }, this)

      return
    }
  }

  cb(new Error(fmt(
    '"%s" wait type option is unknown',
    wait.type
  )))
}

CommandRunner.prototype._setupLog = function(log, errCb) {
  // Load matching "log" plugin
  for (var handledType in this._plugins.log) {
    if (log.type === handledType) {
      this._plugins.log[handledType](log.options, (err) => {
        if (err) {
          errCb(err)
        }
      }, this)

      return
    }
  }

  errCb(new Error(fmt(
    '"%s" log type option is unknown',
    log.type
  )))
}

module.exports = CommandRunner
