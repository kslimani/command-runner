#!/usr/bin/env node
var AsyncRunner = require('../lib/AsyncRunner')
var commandLineArgs = require('command-line-args')

var cli = commandLineArgs([
  {name: 'help', alias: 'h', type: Boolean, description: 'Display this usage help.'},
  {name: 'config', alias: 'c', type: String, description: 'The JSON configuration filepath.', defaultValue: null},
  {name: 'debug', alias: 'd', type: Boolean, description: 'Enable debug output.', defaultValue: false},
])

var options = cli.parse()

if (options.help || options.config === null) {
  console.log(cli.getUsage({
    title: 'command-runner',
    description: 'Run a set of commands.',
  }))
  process.exit()
}

var runner = new AsyncRunner(options.config)

if (options.debug) {
  runner.debug(true)
}

runner.run()
