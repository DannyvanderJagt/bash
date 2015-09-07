import uid from 'uid';
import {exec} from 'child_process';
import Process from './process';
import Command from './command';
import util from 'util';

/**
 * Bash Center.
 * @namespace bashcenter
 */
let BashCenter = {
    /**
     * @var {Object} _processes - All the running processes.
     */
    _processes: {},
    
    /**
     * Get a list of all the processes.
     * @name list
     * @return {Object} A list of all the processes.
     */
    list(){
        return this._processes;
    },
    
    /**
     * Create a new process.
     * @param  {Object} settings - The settings for the new process.
     * @return {Object} Project
     */
    create(settings = {}){
        let pr = new Process(settings);
        this._processes[pr.id] = pr; 
        return pr;
    },
    
    /**
     * Kill all the current processes.
     * @return {[type]} [description]
     */
    killAll(){
        for(let id in this._processes){
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

        let p = exec(command.executingLine, (error, stderr, stdout) => {
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
    }
};

export default BashCenter;


let p1 = BashCenter.create();
p1.on('pid', (pid)=>{
    console.log('pid', pid);
});
p1.on('finished', (command)=>{
    console.log('command', command, p1.shell.pid);
});
p1.on('error', (command)=>{
    console.log('error', command);
});

p1.exec('node ./build/index.js');

/* 
    Kill all the process when the node process exists
    to prevent useless running processes.
*/
process.on('exit', function(code) {
    BashCenter.killAll();
});
process.on('SIGINT', function() {
  process.exit();
});
