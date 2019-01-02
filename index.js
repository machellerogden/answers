#!/usr/bin/env node
'use strict';

const inquirer = require('inquirer');
const reduce = require('lodash/reduce');
const isEmpty = require('lodash/isEmpty');
const merge = require('lodash/merge');
const get = require('lodash/get');
const set = require('lodash/set');
const has = require('lodash/has');
const Rc = require('./rc');
const { process:p, deepmerge } = require('sugarmerge');

function getUnfulfilled({ prompts, config, prefix }) {
    const prefixPath = prefix
        ? `${prefix}.`
        : '';
    return reduce(prompts, (acc, prompt) => {
        if (get(config, `${prefixPath}${prompt.name}`) == null) {
            if (prompt.when) {
                const originalWhen = prompt.when;
                prompt.when = answers => originalWhen(merge(config, answers));
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

const Prefix = (prefix, prompts) => prompts.map((prompt) => {
        const name = `${prefix ? `${prefix}.` : ''}${prompt.name}`;
        prompt.name = name;
        if (typeof prompt.when === 'function') {
            const originalWhen = prompt.when;
            const when = answers => originalWhen(answers[prefix]);
            prompt.when = when;
        }
        return prompt;
    });

function Answers(options = {}) {

    options.name = options.name || 'answers';

    options.prompts = options.prompts || [];

    options.prefix = typeof options.prefix === 'string'
        ? options.prefix
        : '';

    options.root = options.root || '/';

    options.home = options.home || (process.platform === 'win32'
        ? process.env.USERPROFILE
        : process.env.HOME);

    options.cwd = options.cwd || process.cwd();

    const { name, argv = null, prefix, root, home, cwd } = options;

    const rc = Rc({ name, argv, prefix, root, home, cwd });

    rc.config = p(rc.config);

    function get(prompts) {
        prompts = Prefix(prefix, prompts || options.prompts);

        const pendingAnswers = (isEmpty(prompts))
            ? Promise.resolve({})
            : inquirer.prompt(getUnfulfilled({ prompts, config: rc.config, prefix }));

        return pendingAnswers
            .then((a) => ({
                ...rc,
                config: deepmerge(rc.config, a)
            }));
    }


    return { get };
}

Answers.source = (prop, config = {}) => {
    return (config.sources || []).reverse().reduce((acc, c) => {
        if (acc) return acc;
        return has(c.config, prop)
            ? c
            : null;
    }, null);
};

module.exports = Answers;
