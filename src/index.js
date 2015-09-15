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
     * @name getProcesses
     * @return {Object} A list of all the processes.
     */
    getProcesses(){
        return this._processes;
    },
    
    /**
     * Create a new process.
     * @name process
     * @param  {Object} settings - The settings for the new process.
     * @return {Object} Project
     */
    // process(settings = {}){
    //     let pr = new Process(settings);
    //     this._processes[pr.id] = pr; 
    //     return pr;
    // },
    
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
    exec(command, args, callback){
        if(util.isFunction(args)){
            callback = args;
            args = [];
        }
        
        let _command = new Command(command, args);
        
        _command.start();
        let _process = ChildProcess.exec('ls', (error, stderr, stdout) => {
            _command.stop();
            
            if(error){
                _command.addError(error);
            }
            
            if(stderr){
                stderr = stderr.toString().split(/\n/g);
                stderr.forEach((line) => {
                   _command.addOutput(line);
                });
            }
            
            if(stdout){
               stdout = stdout.toString().split(/\n/g);
               stdout.forEach((line) => {
                   _command.addOutput(line);
               });
            }
            
            if(callback){
                callback(_command.getData());
            }
        });
        
        _command.setPid(_process.pid);
        
        return;
    },
    /**
     * Execute a command sync.
     * @name execSync
     * @param  {String} command - The command.
     * @param  {Array} args - The arguments.
     * @return {Object} The results.
     */
    execSync(command, args){
        let _command = new Command(command, args);
        
        // Start.
        _command.start();
        
        // Execute.
        let result = ChildProcess.spawnSync(_command.command,_command.arguments,{encoding:'utf-8'});
        
        // Stop.
        _command.stop();
        _command.setPid(result.pid);
        
        if(result.error){
            _command.addError(result.error.message);
        }
        
        if(result.output){
            _command.addOutput(result.output.join(''));
        }
        
        return _command.getData();
    },
    
    /**
     * Check to see if a specific port is free to use.
     * @param  {Int}  port - The port
     * @return {Boolean} true when the port is available, false otherwise.
     */
    isPortFree(port){
        let result = Bash.execSync('lsof', ['-i:'+port]);

        if(result.output && result.output[0] === ''){
            return true;
        }
        return false;
    },
    
    /**
     * Check to see if a PID is used.
     * @name isPIDFree
     * @param  {Int}  pid - the pid
     * @return {Boolean} true when the pid is free, false otherwise.
     */
    isPIDFree(pid){
        let result = Bash.execSync('ps', ['-p ' + pid]);
        if(result.output && result.output[0] === ''){
            return true;
        }

        let lines = result.output[0].split('\n');
        console.log(lines);
        if(lines.length > 2){
            return false;
        }
        return true;
    },
    
    /**
     * Get a pid from a port. When the port is not in use you will get undefined.
     * @name getPIDByPort
     * @param  {Int} port - The port.
     * @return {Int, Void} When the port is used you will get the PID from that process. Otherwise you will get undefined.
     */
    getPIDByPort(port){
        let result = Bash.execSync('lsof',['-i:'+port]);

        if(result.output && result.output[0] === ''){
            return;
        }
        
        let lines = result.output[0].split('\n');
        if(lines.length <= 2){
            return;
        }
        
        let args = lines[1].split(/\s+/);
        
        if(args[1]){
            return Number(args[1]);
        }
         
        return;
    }
};

export default Bash;
