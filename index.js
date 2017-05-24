#!/usr/bin/env node
'use strict';

const Promise = require('bluebird');
const inquirer = require('inquirer');
const reduce = require('lodash/reduce');
const isEmpty = require('lodash/isEmpty');
const result = require('lodash/result');
const minimist = require('minimist');
const path = require('path');
const readPkgUp = require('read-pkg-up');
const parentModule = require('parent-module')();
const pkg = readPkgUp.sync({ cwd: path.dirname(parentModule) }).pkg;
const Rc = require('rc-lite');
const expander = require('./lib/expander');
const composer = require('./lib/composer');

function getUnfulfilled({ prompts, config }) {
    return reduce(prompts, (acc, prompt) => {
        if (isEmpty(result(config, prompt.name))) {
            acc.push(prompt);
        }
        return acc;
    }, []);
}

function answers(options = {}) {
    options.name = options.name || pkg.name;
    options.prompts = options.prompts || [];
    options.args = options.args || process.argv.slice(2);

    function configure(optionName, optionValue) {
        options[optionName] = optionValue;
    }

    function get() {
        const { name, prompts, args } = options;
        const rc = Rc(name, {});
        const rcx = expander(rc);
        const argv = minimist(args);
        const argx = expander(argv);
        const config = composer(rcx, argx);
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

module.exports = answers;
