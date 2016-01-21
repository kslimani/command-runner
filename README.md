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

This JSON file is used to specify all the commands to run asynchronously.

__Example configuration file :__

```json

{
  "http-server": {
    "cmd": [ "http-server", "-p", "8000", "./" ],
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
  "localtunnel": {
    "cmd": [ "lt", "--port", "8000" ],
    "wait": {
      "type": "output",
      "options": {
        "match": "your url is:",
        "timeout": "3000"
      }
    }
  },
  "test": {
    "cmd": [ "tape", "tests/**/*.js" ],
    "depends": [ "http-server", "localtunnel" ],
    "log": {
      "type": "output"
    },
    "exit_on_success": true
  }
}

```

## Options

| Name | Type | Required | Description |
| :--- | :--: | :------: | :---------- |
| cmd | Array | yes | The command to run |
| cwd | string | no | The command working directory. Default is current directory. |
| depends | Array | no | The names of command dependencies. Name must be defined in configuration. |
| [log](#log-configuration-object) | Object | no | The command output log configuration. |
| [wait](#wait-configuration-object) | Object | no | The command start wait condition configuration. |
| exit_on_success | boolean | no | Indicate if runner gracefully exit if the command terminate with zero exit code. Default is __false__. |
| abort_on_error | boolean | no | Indicate if runner gracefully abort if the command terminate with non-zero exit code. Default is __true__. |

### "log" configuration object

| Name | Type | Required | Description |
| :--- | :--: | :------: | :---------- |
| type | string | yes | The output log type : `file`, `output`, `stdout` or `stderr`. |
| options | Object | no | The output log options. |

`output`: respectively redirect command process stdout and stderr to runner stdout and stderr. Has no options.

`stdout`: redirect only command process stdout to runner stdout. Has no options.

`stderr`: redirect only command process stderr to runner stderr. Has no options.

`file`: redirect command process output to a file using the following options :

| Name | Type | Required | Description |
| :--- | :--: | :------: | :---------- |
| name | string | yes | The filename. |
| input | string | no | The stream input : `output`, `stdout` or `stderr`. Default is `output`. |
| stream_options | Object | no | The [fs.createStream](https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options) options. |

[fs.createStream](https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options) default behavious is open file for writing. The file is created (if it does not exist) or truncated (if it exists). To append, just set `stream_options` to `{"flags": "a"}`.

### "wait" configuration object

| Name | Type | Required | Description |
| :--- | :--: | :------: | :---------- |
| type | string | yes | The wait condition type : `output`, `socket` or `timer`. |
| options | Object | no | The wait condition options. |

`output`: wait for an output string (stdout and stderr) to match using the following options :

| Name | Type | Required | Description |
| :--- | :--: | :------: | :---------- |
| match | string | yes | The string to match. |
| timeout | number | no | The wait timeout in milliseconds. Default is `10000`. |

`socket`: wait for a socket using the following options :

| Name | Type | Required | Description |
| :--- | :--: | :------: | :---------- |
| port | number | yes | The port number. |
| host | string | no | The hostname or ip address. Default is `localhost` |
| timeout | number | no | The wait timeout in milliseconds. Default is `10000`. |
| interval | number | no | The connect retry interval in milliseconds. Default is `200`. |

`timer`: wait for a timer duration using the following options :

| Name | Type | Required | Description |
| :--- | :--: | :------: | :---------- |
| duration | number | yes | The wait duration in milliseconds. Must be greater than or equal to 100. |
