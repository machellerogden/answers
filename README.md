# Answers

> Cascading Config Provider

This README sucks. This package does not. I WILL improve this README one day, but there should be enough information in the "Background & Credit" section below and in the example in the `./examples` directory to get you started.

## Usage

```
require('answers')({
    // your application's name
    name: 'foo',
    // optional inquirer prompts
    prompts: [
        {
            type: 'input',
            name: 'name',
            message: 'what is your name?'
        }
    ]
}).get().then(console.log);
```

## Background & Credits

Much of the config sourcing code was originally taken from Dominic Tarr's [rc](https://github.com/dominictarr/rc) package. As a result, you should review [rc's README](https://github.com/dominictarr/rc#readme) —— most of what's there holds true. The call signature on the main export is different from that of rc's (see example above), and I've implemented many changes to how the various config sources are composed. Answers has two key enhancements on top of rc: it allows for overriding and amending values in deep inside complex data structures and it has the ability to ask the user for any missing config options by providing a collection of [inquirer](https://github.com/SBoudrias/Inquirer.js#readme) prompts in the options object.

## License

Apache-2.0q
