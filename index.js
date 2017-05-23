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
    const {
        name = pkg.name,
        prompts = [],
        args = process.argv.slice(2)
    } = options;
    const rc = Rc(name, {});
    const rcx = expander(rc);
    const argv = minimist(args);
    const argx = expander(argv);
    const config = composer(rcx, argx);
    const unfulfilled = getUnfulfilled({ prompts, config });
    let pendingAnswers;
    if (prompts.length) {
        pendingAnswers = inquirer.prompt(unfulfilled);
    } else {
        pendingAnswers = Promise.resolve({});
    }
    return pendingAnswers.then((responses) =>  composer(config, responses));
}

module.exports = answers;
