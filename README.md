# command-runner

A simple command runner, inspired from [Whiskey process runner](https://github.com/cloudkick/whiskey/blob/master/PROCESS_RUNNER.md).

## installation

```sh
npm install -g command-runner
```

This will install the command-runner module globally and add the 'cr' cli tool to your PATH.

## use

```sh
cr --config filename.json [--debug]
```

## Configuration file

This file is used to specify all the commands to run.

Example configuration file :

```json

{
  "http_server": {
    "cmd": [ "make", "start-http" ],
    "log": {
      "type": "file",
      "options": {
        "name": "http-server.log"
      }
    },
    "wait": {
      "type": "socket",
      "options": {
        "host": "127.0.0.1",
        "port": "8000",
        "timeout": "3000"
      }
    }
  },
  "tunnel": {
    "cmd": [ "make", "start-tunnel" ],
    "wait": {
      "type": "output",
      "options": {
        "match": "your url is:",
        "timeout": "3000"
      }
    }
  },
  "test": {
    "cmd": [ "make", "test" ],
    "depends": [ "http_server", "tunnel" ],
    "log": {
      "type": "output"
    },
    "exit_on_success": true
  }
}

```
