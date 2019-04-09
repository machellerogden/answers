# ![answers](answers.svg?raw=true&sanitize=true)

> Cascading Config Provider

Answers is the easiest way to give your Node.js CLI config sourcing superpowers.

The cascade for sourcing config was directly inspired by [Dominic Tarr](https://github.com/dominictarr)'s [RC](https://github.com/dominictarr/rc) module.

Given an application named `appname`, answers will source config in the following order:

  * command line arguments
  * environment variables prefixed with `${appname}_`
  * `.${appname}rc` relative to your current working directly, and then any `.${appname}rc` in parent directories of your current working directory.
  * `$HOME/.${appname}rc`
  * `$HOME/.${appname}/config`
  * `$HOME/.config/${appname}`
  * `$HOME/.config/${appname}/config`
  * `/etc/${appname}rc`
  * `/etc/${appname}/config`
  * the `defaults` options object

All configuration sources will be merged via [sugarmerge](https://github.com/machellerogden/sugarmerge). You should read up on what this means.

If you passed the `prompts` option, any unfulfilled prompts will fire off and will ask the user for the missing config.

## Usage

```
(async () => {

    const answers = await require('answers')({

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

    });

    console.log(answers);

})();
```

## Background & Credits

The config sourcing order was inspired by Dominic Tarr's [rc](https://github.com/dominictarr/rc) package. Answers has two key enhancements on top of rc: it allows for overriding and amending values in deep inside complex data structures and it has the ability to ask the user for any missing config options by providing a collection of [inquirer](https://github.com/SBoudrias/Inquirer.js#readme) prompts in the options object.

## License

MIT
