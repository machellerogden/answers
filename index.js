#!/usr/bin/env node
'use strict';

const Promise = require('bluebird');
const inquirer = require('inquirer');
const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));
const path = require('path');
const readPkgUp = require('read-pkg-up');
const parentModule = require('parent-module')();
const pkg = readPkgUp.sync({ cwd: path.dirname(parentModule) }).pkg;
const Rc = require('rc');

function getUnfulfilled({ prompts, config }) {
    return _.reduce(prompts, (acc, prompt) => {
        if (_.isEmpty(_.result(config, prompt.name))) {
            acc.push(prompt);
        }
        return acc;
    }, []);
}

function answers(options) {
    const ns = options.name || pkg.name;
    const rc = Rc(ns, {});
    const config = _.assign({}, rc, argv);
    const prompts = _.result(options, 'prompts', []);
    const unfulfilled = getUnfulfilled({ prompts, config });
    let pendingAnswers;
    if (prompts.length) {
        pendingAnswers = inquirer(unfulfilled);
    } else {
        pendingAnswers = Promise.resolve({});
    }
    return pendingAnswers.then((responses) =>  _.assign(config, responses));
}

module.exports = answers;
