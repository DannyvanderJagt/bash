import {spawn} from 'child_process';
import {EventEmitter} from 'events';
import Command from '../command';
import uid from 'uid';
import util from 'util';

class Process extends EventEmitter{
    constructor(settings){
        super();
        this.id = uid();
        this.settings = Object.assign({
            stream: true
        }, settings);
        
        // The command that is executed.
        this.command = null;
        this.queue = [];
        this.available = false;

        // Create a new bash.
        this.shell = spawn('bash');
    
        // Listen for all the events.
        this.shell.stderr.on('data', this._onCommandError.bind(this));
        this.shell.stdout.on('data', this._onData.bind(this));
        this.shell.on('exit', this._onExit);
        this.shell.on('close', this._onExit);
        this.shell.on('SIGTERM', this._onExit);
        
        this.emit('created');
        this._setAvailable(true);
    }
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
    isAvailable(){
        return this.command ? false : true;
    }
    exec(command, callback){
        if(util.isArray(command)){
            command.forEach((command) => {
                this.exec(command, callback);
            });
            return false;
        }
        if(this.command){
            this.addToQueue(command, callback);
            return false;
        }
        if(!command){
            this.emit('error', 'The command can not be empty!');
            return false;
        }
        
        // Create the command.
        this._setAvailable(false);
        this.command = new Command(command);
        
        if(command){
            this.command.addCallback(callback);
        }
        
        this.emit('executing', command);
        
        // Execute the command.
        this.shell.stdin.write(this.command.executingLine);
    }
    addToQueue(command, callback){
        this.queue.push([command, callback]);
    }
    checkQueue(){
        if(this.queue.length === 0){
            this._setAvailable(true);
            return false;
        }
        let command = this.queue[0];
        this.queue.shift();
        this.exec(command[0], command[1]);
    }
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
                this.checkQueue();
                return false;
            }
        
            if(this.command){
                this.command.addToResult(line);
            }
            
            if(this.settings.stream){
                this.emit('data', line);
            }
        });
    }
    _onCommandError(data){
        let error = data.toString();
        this.command.addError(error);
        this.emit('error', error, this.command.getOutput());
    }
    _onEnd(){
        this.emit('end');
    }
    _onExit(code){
        this.emit('exit', code);
    }
    kill(){
        this.shell.kill('SIGHUP');
        this.emit('killed');
    }
}

export default Process;
