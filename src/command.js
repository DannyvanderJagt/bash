import {EventEmitter} from 'events';

class Command extends EventEmitter{
    constructor(command = '', args = [], pid = null){
        super();
        this.command = command;
        this.arguments = args;
        
        this.pid = pid;
        
        this.output = [];
        this.error = [];
        
        this.startTime = null;
        this.endTime = null;
    }
    addOutput(line){
        this.output.push(line);
    }
    addError(error){
        this.error.push(error);
    }
    setPid(pid){
        this.pid = pid;
    }
    getData(){
        return{
            command: this.command,
            arguments: this.arguments,
            pid: this.pid,
            startTime: this.startTime,
            stopTime: this.stopTime,
            error: this.error,
            output: this.output
        };
    }
    start(){
        this.startTime = new Date().getTime();
    }
    stop(){
        this.stopTime = new Date().getTime();
    }
    makeCommandCatchable(){
        return [
            'echo start',
            command,
            'sleep .1',
            'echo end'
        ].join(' && ') + '\n';
    }
}

export default Command;
