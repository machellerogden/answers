#!/usr/bin/env node
'use strict';

/**
 * See accompanying `.basicrc` file in this directory for an example config file.
 *
 * Exercise 1:
 *
 * Run this example from this directory...
 *
 *   cd ./examples
 *   ./basic.js
 *
 * Note that answers will ask for `name` but not for `greeting` because `greeting` is already defined in the config.
 *
 * Exercise 2:
 *
 * Review the contents of `.basicrc` again and then try these commands:
 *
 *   cd ./examples
 *   ./basic.js --name jane --foo.bar[+] after
 *   ./basic.js --name jane --foo.bar[-] before
 *   ./basic.js --name jane --foo.bar[1,2] in-between
 *   ./basic.js --name jane --foo.bar[2][1].bam boom
 *   ./basic.js --name jane --foo.bar[2][-].a 1
 *   ./basic.js --name jane --foo.bar[2][1].bam boom
 *   ./basic.js --name jane --foo.bar[2][+].bam[+] boom
 *
 */

require('..')({
    name: 'basic',
    prompts: [
        {
            type: 'input',
            name: 'greeting',
            message: 'how do you say hey?',
            default: 'hello'
        },
        {
            type: 'input',
            name: 'name',
            message: 'what is your name?',
            default: 'world'
        }
    ]
}).get().then((config) => {
    console.log(JSON.stringify(config, null, 4));
});
