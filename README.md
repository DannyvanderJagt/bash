> **Disclaimer: This repo is part of my personal project named Suitcase.**  
> It is not meant to be used by other people or in production.    
> You can use it if you want but at your own risk.

# Bash Center
Execute bash commands or create a bash process and execute commands there.

## Docs
All the documentation can be found at [master/docs](https://github.com/DannyvanderJagt/bash-center/tree/master/docs).

## Usage
```js
import BashCenter from 'bash-center';

// Execute a single command without creating a living process.
BashCenter.exec('ls', (command) => {
    console.log(command);
});

// Create a process.
let p1 = BashCenter.process({
    command: 'node', // default: bash
    arguments: ['test.js'], // default: []
    detached: true, // default: false
});

// Listen for any output. (All the output will be emitted line by line)
p1.on('data', (line) => {
    console.log(line);
});

// When the command is finished this will be fired with the command instance as parameter.
p1.on('finished', (command) =>{
    console.log(command);
});

// Execute the ls command.
p1.exec('ls');
```

## Owner
[Danny van der Jagt](https://github.com/DannyvanderJagt)
