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
    _processes: {},

    /**
     * Get a list of all the processes.
     * @name list
     * @return {Object} A list of all the processes.
     */
    list: function list() {
        return this._processes;
    },

    create: function create(settings) {
        var pr = new _process2['default'](settings);
        this._processes[pr.id] = pr;
        return pr;
    },

    killAll: function killAll() {
        for (var id in this._processes) {
            this._processes[id].kill();
        }
    },

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

// BashCenter.exec('ls', (command)=>{
//     console.log('exec', command);
// });

var p1 = BashCenter.create({});

// p1.on('data', (line) => {
//     console.log('line', line);
// });
// p1.on('finished', (command) => {
//     console.log('finished', command);
// });
//
// p1.on('error', (error, command) => {
//     console.log('error', error, command);
// });
//
// p1.on('executing', () => {
//     console.log('executing');
// });

p1.on('available', function (line) {
    console.log('available');
});

p1.on('unavailable', function (line) {
    console.log('unavailable');
});

console.log(p1.isAvailable());

// p1.exec('cd src');
// p1.exec('cd command');
// p1.exec('open .');
// setTimeout(()=>{
//     console.log('Sesam, open u!');
p1.exec(['ls', 'cd src', 'cd command']);
// },1000);

// "open -a Sketch \/Volumes\/Nifty\\ Drive\/Minor\\ Suitcase\/Design\/Icons.sketch"
// "open -a Google\\ Chrome \"https://twitter.com\""
process.on('exit', function (code) {
    console.log(BashCenter.killAll());
});

process.on('SIGINT', function () {
    process.exit();
});
module.exports = exports['default'];