import uid from 'uid';
import ChildProcess from 'child_process';
import Process from './process';
import Command from './command';
import util from 'util';

/**
 * Bash Center.
 * @namespace bashcenter
 */
let Bash = {
    /**
     * @var {Object} _processes - All the running processes.
     */
    _processes: {},
    
    /**
     * Get a list of all the processes.
     * @name list
     * @return {Object} A list of all the processes.
     */
    getProcesses(){
        return this._processes;
    },
    
    /**
     * Create a new process.
     * @param  {Object} settings - The settings for the new process.
     * @return {Object} Project
     */
    process(settings){
        let pr = new Process(settings);
        this._processes[pr.id] = pr; 
        return pr;
    },
    
    /* 
        Kill all the process (except the detached ones) when the node process exists
        to prevent useless running processes.
    */
    killProcessesOnExit(detached = false){
        process.on('exit', function(code) {
            BashCenter.killAll(detached);
        });

        process.on('SIGINT', function() {
            process.exit();
        });
        return true;
    },
    
    /**
     * Kill all the current processes.
     * @param {Boolean} detached - Kill all the detached process too.
     */
    killAll(detached = true){
        for(let id in this._processes){
            if(!detached && (this._processes[id].settings && this._processes[id].settings.detached === true)){
                return;
            }
            this._processes[id].kill();
        }
    },
    
    /**
     * Execute a command.
     * @param  {String}   command  - The command
     * @param  {Function} callback - The callback.
     */
    exec(command, callback){
        command = new Command(command);
        if(util.isFunction(callback)){
            command.addCallback(callback);
        }

        let p = ChildProcess.exec(command.executingLine, (error, stderr, stdout) => {
            if(error){
                command.addError(error);
            }
            if(stderr){
                stderr = stderr.toString().split(/\n/g);
                stderr.forEach((line) => {
                    command.addToResult(line);
                });
            }
            if(stdout){
                stdout = stdout.toString().split(/\n/g);
                stdout.forEach((line) => {
                    command.addToResult(line);
                });
            }
        });
    },
    /**
     * Execute a command sync.
     * @param  {String} command - The command.
     * @return {[type]}         [description]
     */
    execSync(command, args){
        let result = ChildProcess.spawnSync(command,args,{encoding:'utf-8'});
        let data = {
            error: null,
            output: null
        };
        if(result.error){
            data.error = result.error.message;
        }
        
        if(result.output){
            data.output = result.output.join('');
        }
        
        return data;
    },
    
    isPortFree(port){
        let result = Bash.execSync('lsof',['-i:'+port]);
        if(result.output === ''){
            return true;
        }
        return false;
    },
    
    isPIDFree(pid){
        let result = Bash.execSync('ps', ['-p ' + pid]);
        if(result.output === ''){
            return true;
        }
        
        let lines = result.output.split('\n');
        if(lines.length === 2){
            return true;
        }
        return false;
    },
    
    getPIDByPort(port){
        let result = Bash.execSync('lsof',['-i:'+port]);

        if(result.output === null){
            return true;
        }
        
        let lines = result.output.split('\n');
        if(lines.length <= 2){
            return false;
        }
        
        let args = lines[1].split(/\s+/);
        
        if(args[1]){
            return Number(args[1]);
        }
         
        return false;
    }
};

export default Bash;
