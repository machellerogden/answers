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
const { name:pkgName = 'answers' } = readPkgUp.sync({ cwd: path.dirname(parentModule) }).pkg || {};
const Rc = require('./rc');
const { process, deepmerge } = require('sugarmerge');

function getUnfulfilled({ prompts, config, prefix }) {
    const prefixPath = prefix
        ? `${prefix}.`
        : '';
    return reduce(prompts, (acc, prompt) => {
        if (get(config, `${prefixPath}${prompt.name}`) == null) {
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
    options.name = options.name || pkgName;
    options.prompts = options.prompts || [];
    options.prefix = typeof options.prefix === 'string'
        ? options.prefix
        : '';

    const { name, argv = null, prefix } = options;
    const rc = Rc(name, argv, prefix);
    const config = process(rc);

    function get(prompts) {
        prompts = prompts || options.prompts;

        const pendingAnswers = (isEmpty(prompts))
            ? Promise.resolve({})
            : inquirer.prompt(getUnfulfilled({ prompts, config, prefix }));

        return pendingAnswers
            .then(a => prefix
                ? { [prefix]: a }
                : a)
            .then((a) =>
                deepmerge(config, a));
    }

    return { get };
}

module.exports = answers;
