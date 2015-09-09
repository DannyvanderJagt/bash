import {spawn} from 'child_process';
import {EventEmitter} from 'events';
import Command from '../command';
import uid from 'uid';
import util from 'util';

/**
 * Process
 * @namespace process
 */
class Process extends EventEmitter{
    
    /**
     * Constructor
     * @private
     * @name constructor
     * @param  {Object} settings - The settings.
     */
    constructor(settings = {}){
        super();
        this.id = uid();
        this.settings = {
            command: settings.command || 'bash', 
            arguments: settings.arguments || [],
            detached: settings.detached || false,
        };
        
        // The command that is executed.
        this.command = null;
        this.queue = [];
        this.available = false;

        // Create a new bash.
        try{
            this.shell = spawn(
                this.settings.command,
                this.settings.arguments,
                {
                    detached: this.settings.detached
                }
            );
        }catch(error){
            this.emit('error', error);
            return false;
        }
            
        // Set the pid.
        this.pid = this.shell.pid;

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
    _setAvailable(state){
        if(this.available === state){
            return false;
        }
        
        this.available = state;
        if(state === true){
            this.emit('available');
        }else if(state === false){
            this.emit('unavailable');
        }
    }
    
    /**
     * Return the availablity of this process.
     * @return {Boolean}
     */
    isAvailable(){
        return this.command ? false : true;
    }
    
    /**
     * Execute a command.
     * @name exec
     * @param  {String}   command  - The bash command.
     * @param  ?{Function} callback - The callback.
     */
    exec(command, callback){
        if(!this.shell){
            return false;
        }
        if(util.isArray(command)){
            command.forEach((command) => {
                this.exec(command, callback);
            });
            return false;
        }
        if(this.command){
            this._addToQueue(command, callback);
            return false;
        }
        if(!command){
            this.emit('error', 'The command can not be empty!');
            return false;
        }
        
        // Create the command.
        this._setAvailable(false);
        this.command = new Command(command);
        
        if(callback){
            this.command.addCallback(callback);
        }
        
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
    _addToQueue(command, callback){
        this.queue.push([command, callback]);
    }
    
    /**
     * Check the waiting queue for commands.
     * @private
     * @name _checkQueue
     */
    _checkQueue(){
        if(this.queue.length === 0){
            this._setAvailable(true);
            return false;
        }
        let command = this.queue[0];
        this.queue.shift();
        this.exec(command[0], command[1]);
    }
    
    /**
     * Process the data that we received from the bash process.
     * @private
     * @name _onData
     * @param  {Buffer} data - Buffer data from the bash process.
     */
    _onData(data){
        // Convert data from buffer to string.
        data = data.toString();
        
        // Get all the lines.
        let lines = data.split(/\n/g);
        
        // Search for start and end.
        lines.forEach((line) => {
            if(line === 'end'){
                this.command.end();
                this.emit('finished', this.command.getOutput());
                this.command = null;
                this._checkQueue();
                return false;
            }
        
            if(this.command){
                this.command.addToResult(line);
            }
            
            if(line){
                this.emit('data', line);
            }
        });
    }
    
    /**
     * Process error from the bash process.
     * @private
     * @name _onCommandError
     * @param  {Buffer} data - Buffer data from the bash process.
     */
    _onCommandError(data){
        let error = data.toString();
        this.command.addError(error);
        this.emit('error', error, this.command.getOutput());
    }
    
    /**
     * Handle the bash process end event.
     * @private
     * @name _onEnd
     * @function
     */
    _onEnd(){
        this.emit('end');
    }
    
    /**
     * Handle the bash process exit event.
     * @private
     * @name _onExit
     * @param  {String} code - The exit code.
     */
    _onExit(code){
        // this.emit('exit', code);
    }
    
    /**
     * Kill this process.
     * @private
     * @name kill
     * @function
     */
    kill(){
        this.shell.kill('SIGHUP');
        this.emit('killed');
    }
}

export default Process;
