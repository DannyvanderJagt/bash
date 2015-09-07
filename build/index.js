'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _uid = require('uid');

var _uid2 = _interopRequireDefault(_uid);

var _child_process = require('child_process');

var _process = require('./process');

var _process2 = _interopRequireDefault(_process);

var _command = require('./command');

var _command2 = _interopRequireDefault(_command);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

/**
 * Bash Center.
 * @namespace bashcenter
 */
var BashCenter = {
    /**
     * @var {Object} _processes - All the running processes.
     */
    _processes: {},

    /**
     * Get a list of all the processes.
     * @name list
     * @return {Object} A list of all the processes.
     */
    list: function list() {
        return this._processes;
    },

    /**
     * Create a new process.
     * @param  {Object} settings - The settings for the new process.
     * @return {Object} Project
     */
    create: function create() {
        var settings = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var pr = new _process2['default'](settings);
        this._processes[pr.id] = pr;
        return pr;
    },

    /**
     * Kill all the current processes.
     * @return {[type]} [description]
     */
    killAll: function killAll() {
        for (var id in this._processes) {
            this._processes[id].kill();
        }
    },

    /**
     * Execute a command.
     * @param  {String}   command  - The command
     * @param  {Function} callback - The callback.
     */
    exec: function exec(command, callback) {
        command = new _command2['default'](command);
        if (_util2['default'].isFunction(callback)) {
            command.addCallback(callback);
        }

        var p = (0, _child_process.exec)(command.executingLine, function (error, stderr, stdout) {
            if (error) {
                command.addError(error);
            }
            if (stderr) {
                stderr = stderr.toString().split(/\n/g);
                stderr.forEach(function (line) {
                    command.addToResult(line);
                });
            }
            if (stdout) {
                stdout = stdout.toString().split(/\n/g);
                stdout.forEach(function (line) {
                    command.addToResult(line);
                });
            }
        });
    }
};

exports['default'] = BashCenter;

var p1 = BashCenter.create();
p1.on('pid', function (pid) {
    console.log('pid', pid);
});
p1.on('finished', function (command) {
    console.log('command', command, p1.shell.pid);
});
p1.on('error', function (command) {
    console.log('error', command);
});

p1.exec('node ./build/index.js');

/* 
    Kill all the process when the node process exists
    to prevent useless running processes.
*/
process.on('exit', function (code) {
    BashCenter.killAll();
});
process.on('SIGINT', function () {
    process.exit();
});
module.exports = exports['default'];