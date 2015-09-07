import uid from 'uid';
import util from 'util';

class Command{
    /**
     * Constructor
     * @private
     * @name constructor
     * @param  {String} command - The bash command.
     */
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
        this.executingLine = this._create(this.command);
        
        if(!this.command){
            this.executingLine = 'echo start && echo end \n';
        }
    }
    
    /**
     * Create the executable command.
     * @private
     * @name _create
     * @param {String} comamnd - The bash command.
     * @return {String} The executable command.
     */
    _create(command){
        return [
            'echo start',
            command, 
            'sleep .1', // A hack to enable to end statement.
            'echo end \n',
        ].join(' && ');
    }
    
    /**
     * Let this instance know that the command is executing.
     * @name start
     * @function
     */
    start(){
        this.executing = true;
        this.startTime = new Date().getTime();
    }
    
    /**
     * Let this instance know that the command is done with executing.
     * @name end
     * @function
     */
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
    
    /**
     * Add a line to the command results.
     * @name addToResult
     * @param {String} line - A line of the results.
     */
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
    
    /**
     * Get all the results.
     * @name getResult
     * @return {Array} All the results line by line.
     */
    getResult(){
        return this._result;
    }
    
    /**
     * Let this is know that there was an error executing this command.
     * @name addError
     * @param {String} error - The error.
     */
    addError(error){
        let lines = error.split(/\n/g);
        lines.forEach((line)=>{
            this.error.push(line);
        });
    }
    
    /**
     * Get the executable command.
     * @getExecutingLine
     * @return {String} The executable command.
     */
    getExecutingLine(){
        return this._executingLine;
    }
    
    /**
     * Add a callback to this command.
     * @name addCallback
     * @param {Function} callback - The callback.
     */
    addCallback(callback){
        if(!util.isFunction(callback)){
            return false;
        }
        this.callback.push(callback);
    }
    
    /**
     * Get the output/total results of this command.
     * @return {Object} The results.
     */
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
