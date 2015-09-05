'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _uid = require('uid');

var _uid2 = _interopRequireDefault(_uid);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var Command = (function () {
    function Command(command) {
        _classCallCheck(this, Command);

        this.id = (0, _uid2['default'])();

        this.executing = false;

        this.command = command;
        this.result = [];
        this.error = [];
        this.callback = [];

        this.startTime = null;
        this.endTime = null;

        // Create the command.
        this.executingLine = this.create();

        if (!this.command) {
            this.executingLine = 'echo start && echo end \n';
            return false;
        }
    }

    _createClass(Command, [{
        key: 'create',
        value: function create() {
            return ['echo start', //['+this.id+']',
            this.command, 'sleep .1', // A hack to enable to end statement.
            'echo end \n']. //['+this.id+']\n',
            join(' && ');
        }

        // The command has started executing.
    }, {
        key: 'start',
        value: function start() {
            this.executing = true;
            this.startTime = new Date().getTime();
        }

        // The command is finished with executing.
    }, {
        key: 'end',
        value: function end() {
            var _this = this;

            if (!this.executing) {
                return false;
            }
            this.executing = false;
            this.endTime = new Date().getTime();
            if (this.callback.length !== 0) {
                this.callback.forEach(function (callback) {
                    if (_util2['default'].isFunction(callback)) {
                        callback(_this.getOutput());
                    }
                });
            }
        }

        // Add a line to the command results.
    }, {
        key: 'addToResult',
        value: function addToResult(line) {
            if (!line) {
                return false;
            }
            if (line === 'start') {
                this.start();
                return false;
            }
            if (!this.executing) {
                return false;
            }
            if (line === 'end') {
                this.end();
                return false;
            }
            this.result.push(line);
        }

        // Get all the results.
    }, {
        key: 'getResult',
        value: function getResult() {
            return this._result;
        }

        //
    }, {
        key: 'addError',
        value: function addError(error) {
            var _this2 = this;

            var lines = error.split(/\n/g);
            lines.forEach(function (line) {
                _this2.error.push(line);
            });
        }
    }, {
        key: 'getExecutingLine',
        value: function getExecutingLine() {
            return this._executingLine;
        }
    }, {
        key: 'addCallback',
        value: function addCallback(callback) {
            if (!_util2['default'].isFunction(callback)) {
                return false;
            }
            this.callback.push(callback);
        }
    }, {
        key: 'getOutput',
        value: function getOutput() {
            return {
                error: this.error,
                result: this.result,
                id: this.id,
                command: this.command,
                executedCommand: this.executingLine,
                startTime: this.startTime,
                endTime: this.endTime,
                executingTime: this.endTime - this.startTime
            };
        }
    }]);

    return Command;
})();

exports['default'] = Command;
module.exports = exports['default'];