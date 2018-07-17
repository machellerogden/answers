#!/usr/bin/env node
'use strict';

const inquirer = require('inquirer');
const reduce = require('lodash/reduce');
const isEmpty = require('lodash/isEmpty');
const merge = require('lodash/merge');
const get = require('lodash/get');
const set = require('lodash/set');
const path = require('path');
const readPkgUp = require('read-pkg-up');
const parentModule = require('parent-module')();
const pkg = readPkgUp.sync({ cwd: path.dirname(parentModule) }).pkg;
const Rc = require('./rc');
const minimist = require('./minimist');
const expander = require('./lib/expander');
const composer = require('./lib/composer');

function getUnfulfilled({ prompts, config }) {
    return reduce(prompts, (acc, prompt) => {
        if (get(config, prompt.name) == null) {
            if (prompt.when) {
                const originalWhen = prompt.when;
                prompt.when = (answers) => originalWhen(merge(config, answers));
            }
            acc.push(prompt);
        } else {
            if (prompt.filter) {
                set(config, prompt.name, prompt.filter(get(config, prompt.name)));
            }
        }
        return acc;
    }, []);
}

function answers(options = {}) {
    options.name = options.name || pkg.name;
    options.prompts = options.prompts || [];

    function configure(optionName, optionValue) {
        options[optionName] = optionValue;
    }

    function get() {
        const { name, prompts, argv = null } = options;
        const rc = Rc(name, argv);
        const config = expander(rc);
        const unfulfilled = getUnfulfilled({ prompts, config });

        let pendingAnswers;

        if (isEmpty(prompts)) {
            pendingAnswers = Promise.resolve({});
        } else {
            pendingAnswers = inquirer.prompt(unfulfilled);
        }

        function compose(responses) {
            return composer(config, responses);
        }

        return pendingAnswers
            .then(compose);
    }

    return {
        get,
        configure
    };
}

/**
 * TODO: remove this. it shouldn't be here. ultimately, I need to work on
 * removing minimist dependency, and extracting expander and composer from this
 * package. In the meantime, I'm making the problem worse by exporting some
 * very ugly internals which i need in another project. the things we do in the
 * name of working software...
 */
answers.deepSet = (obj, keypath, value) => {
    /* eslint-disable-next-line */
    const { _, ...m } = minimist([ `--${keypath}`, value ]);
    return expander(composer({}, obj, m));
};

module.exports = answers;
