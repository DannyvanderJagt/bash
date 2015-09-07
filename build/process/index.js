'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _child_process = require('child_process');

var _events = require('events');

var _command = require('../command');

var _command2 = _interopRequireDefault(_command);

var _uid = require('uid');

var _uid2 = _interopRequireDefault(_uid);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

/**
 * Process
 * @namespace process
 */

var Process = (function (_EventEmitter) {
    _inherits(Process, _EventEmitter);

    /**
     * Constructor
     * @private
     * @name constructor
     * @param  {Object} settings - The settings.
     */

    function Process(settings) {
        _classCallCheck(this, Process);

        _get(Object.getPrototypeOf(Process.prototype), 'constructor', this).call(this);
        this.id = (0, _uid2['default'])();
        this.settings = {
            stream: settings.stream || true
        };

        // The command that is executed.
        this.command = null;
        this.queue = [];
        this.available = false;

        // Create a new bash.
        this.shell = (0, _child_process.spawn)('bash', { detached: true });

        // Listen for all the events.
        this.shell.stderr.on('data', this._onCommandError.bind(this));
        this.shell.stdout.on('data', this._onData.bind(this));
        this.shell.on('exit', this._onExit);
        this.shell.on('close', this._onExit);
        this.shell.on('SIGTERM', this._onExit);

        this.emit('created');
        this._setAvailable(true);
    }

    /**
     * Set the availablity of this process.
     * @private
     * @name _setAvailable
     * @param {[type]} state [description]
     */

    _createClass(Process, [{
        key: '_setAvailable',
        value: function _setAvailable(state) {
            if (this.available === state) {
                return false;
            }

            this.available = state;
            if (state === true) {
                this.emit('available');
            } else if (state === false) {
                this.emit('unavailable');
            }
        }

        /**
         * Return the availablity of this process.
         * @return {Boolean}
         */
    }, {
        key: 'isAvailable',
        value: function isAvailable() {
            return this.command ? false : true;
        }

        /**
         * Execute a command.
         * @name exec
         * @param  {String}   command  - The bash command.
         * @param  ?{Function} callback - The callback.
         */
    }, {
        key: 'exec',
        value: function exec(command, callback) {
            var _this = this;

            if (_util2['default'].isArray(command)) {
                command.forEach(function (command) {
                    _this.exec(command, callback);
                });
                return false;
            }
            if (this.command) {
                this._addToQueue(command, callback);
                return false;
            }
            if (!command) {
                this.emit('error', 'The command can not be empty!');
                return false;
            }

            // Create the command.
            this._setAvailable(false);
            this.command = new _command2['default'](command);

            if (callback) {
                this.command.addCallback(callback);
            }

            // Chain the pid event.
            this.command.on('pid', this.emit.bind(this, 'pid'));

            // Execute the command.
            this.emit('executing', command);
            this.shell.stdin.write(this.command.executingLine);
        }

        /**
         * Add a command to the waiting queue.
         * @private
         * @name _addToQueue
         * @param {String}   command  - The bash command.
         * @param {Function} callback - The callback.
         */
    }, {
        key: '_addToQueue',
        value: function _addToQueue(command, callback) {
            this.queue.push([command, callback]);
        }

        /**
         * Check the waiting queue for commands.
         * @private
         * @name _checkQueue
         */
    }, {
        key: '_checkQueue',
        value: function _checkQueue() {
            if (this.queue.length === 0) {
                this._setAvailable(true);
                return false;
            }
            var command = this.queue[0];
            this.queue.shift();
            this.exec(command[0], command[1]);
        }

        /**
         * Process the data that we received from the bash process.
         * @private
         * @name _onData
         * @param  {Buffer} data - Buffer data from the bash process.
         */
    }, {
        key: '_onData',
        value: function _onData(data) {
            var _this2 = this;

            // Convert data from buffer to string.
            data = data.toString();

            // Get all the lines.
            var lines = data.split(/\n/g);

            // Search for start and end.
            lines.forEach(function (line) {
                if (line === 'end') {
                    _this2.command.end();
                    _this2.emit('finished', _this2.command.getOutput());
                    _this2.command = null;
                    _this2._checkQueue();
                    return false;
                }

                if (_this2.command) {
                    _this2.command.addToResult(line);
                }

                if (_this2.settings.stream) {
                    _this2.emit('data', line);
                }
            });
        }

        /**
         * Process error from the bash process.
         * @private
         * @name _onCommandError
         * @param  {Buffer} data - Buffer data from the bash process.
         */
    }, {
        key: '_onCommandError',
        value: function _onCommandError(data) {
            var error = data.toString();
            this.command.addError(error);
            this.emit('error', error, this.command.getOutput());
        }

        /**
         * Handle the bash process end event.
         * @private
         * @name _onEnd
         * @function
         */
    }, {
        key: '_onEnd',
        value: function _onEnd() {
            this.emit('end');
        }

        /**
         * Handle the bash process exit event.
         * @private
         * @name _onExit
         * @param  {String} code - The exit code.
         */
    }, {
        key: '_onExit',
        value: function _onExit(code) {
            this.emit('exit', code);
        }

        /**
         * Kill this process.
         * @private
         * @name kill
         * @function
         */
    }, {
        key: 'kill',
        value: function kill() {
            this.shell.kill('SIGHUP');
            this.emit('killed');
        }
    }]);

    return Process;
})(_events.EventEmitter);

exports['default'] = Process;
module.exports = exports['default'];