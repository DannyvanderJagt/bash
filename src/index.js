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
    _processes: {},
    
    /**
     * Get a list of all the processes.
     * @name list
     * @return {Object} A list of all the processes.
     */
    list(){
        return this._processes;
    },
    
    create(settings){
        let pr = new Process(settings);
        this._processes[pr.id] = pr; 
        return pr;
    },
    
    killAll(){
        for(let id in this._processes){
            this._processes[id].kill();
        }
    },
    
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

// BashCenter.exec('ls', (command)=>{
//     console.log('exec', command);
// });


let p1 = BashCenter.create({});

// p1.on('data', (line) => {
//     console.log('line', line);
// });
// p1.on('finished', (command) => {
//     console.log('finished', command);
// });
// 
// p1.on('error', (error, command) => {
//     console.log('error', error, command);
// });
// 
// p1.on('executing', () => {
//     console.log('executing');
// });

p1.on('available', (line) => {
    console.log('available');
});

p1.on('unavailable', (line) => {
    console.log('unavailable');
});

console.log(p1.isAvailable());

// p1.exec('cd src');
// p1.exec('cd command');
// p1.exec('open .');
// setTimeout(()=>{
//     console.log('Sesam, open u!');
    p1.exec([
        'ls',
        'cd src',
        'cd command',
        // "open -a Sketch \/Volumes\/Nifty\\ Drive\/Minor\\ Suitcase\/Design\/Icons.sketch"
        // "open -a Google\\ Chrome \"https://twitter.com\""
    ]);
// },1000);
process.on('exit', function(code) {
    console.log(BashCenter.killAll());
});

process.on('SIGINT', function() {
  process.exit();
});
