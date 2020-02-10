#!/usr/bin/env node
const AsyncRunner = require('../lib/AsyncRunner')
const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')

var optionList = [
  {name: 'help', alias: 'h', type: Boolean, description: 'Display this usage help.'},
  {name: 'config', alias: 'c', type: String, description: 'The JSON configuration filepath.', defaultValue: null},
  {name: 'debug', alias: 'd', type: Boolean, description: 'Enable debug output.', defaultValue: false},
]

var options = {}

try {
  options = commandLineArgs(optionList)
} catch (e) {
  // Assume e is UNKNOWN_OPTION error
  options.help = true
}

if (options.help || options.config === null) {
  console.log(commandLineUsage([
    {
      header: 'command-runner',
      content: 'Run a set of commands.',
    },
    {
      header: 'Options',
      optionList: optionList,
    }
  ]))
  process.exit()
}

var runner = new AsyncRunner(options.config)

if (options.debug) {
  runner.debug(true)
}

runner.run()
