import uid from 'uid';
import util from 'util';

class Command{
    constructor(command){
        this.id = uid();
        
        this.executing = false;
        
        this.command = command;
        this.result = [];
        this.error = [];
        this.callback = [];
        
        this.startTime = null;
        this.endTime = null;
    
        // Create the command.
        this.executingLine = this.create();
        
        if(!this.command){
            this.executingLine = 'echo start && echo end \n';
            return false;
        }
    }
    create(){
        return [
            'echo start',//['+this.id+']',
            this.command, 
            'sleep .1', // A hack to enable to end statement.
            'echo end \n',//['+this.id+']\n',
        ].join(' && ');
    }
    // The command has started executing.
    start(){
        this.executing = true;
        this.startTime = new Date().getTime();
    }
    // The command is finished with executing.
    end(){
        if(!this.executing){
            return false;
        }
        this.executing = false;
        this.endTime = new Date().getTime();
        if(this.callback.length !== 0){
            this.callback.forEach((callback) => {
                if(util.isFunction(callback)){
                    callback(this.getOutput());
                }
            });
        }
    }
    // Add a line to the command results.
    addToResult(line){
        if(!line){
            return false;
        }
        if(line === 'start'){
            this.start();
            return false;
        }
        if(!this.executing){
            return false;
        }
        if(line === 'end'){
            this.end();
            return false;
        }
        this.result.push(line);
    }
    // Get all the results.
    getResult(){
        return this._result;
    }
    // 
    addError(error){
        let lines = error.split(/\n/g);
        lines.forEach((line)=>{
            this.error.push(line);
        });
    }
    getExecutingLine(){
        return this._executingLine;
    }
    addCallback(callback){
        if(!util.isFunction(callback)){
            return false;
        }
        this.callback.push(callback);
    }
    getOutput(){
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
}
export default Command;
