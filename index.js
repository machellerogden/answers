#!/usr/bin/env node
'use strict';

module.exports = Answers;

const inquirer = require('inquirer');
const edn = require('edn-to-js');

const path = require('path');
const {
    readFile,
    constants
} = require('fs').promises;

const findUp = require('find-up');

const ini = require('ini');
const yaml = require('yamljs');
const stripJsonComments = require('strip-json-comments');
const { merge, process:sugarProcess } = require('sugarmerge');

const { isNumeric, has } = require('needful');
const isFlag = v => /^-.+/.test(v);

const cast = v => isNumeric(v)
    ? +v
    : [ 'true', 'false' ].includes(v)
        ? v === 'true' ? true : false
        : v;

const trim = v => /^--?(.+)/.exec(v)[1];

const getConfigPaths = ({ name, paths }) => {
    const { cwd, home, etc } = paths;
    const configFilename = `.${name}rc`;
    return [
        path.join(etc, name, 'config'),
        path.join(etc, configFilename),
        path.join(home, '.config', name, 'config'),
        path.join(home, '.config', name),
        path.join(home, `.${name}`, 'config'),
        path.join(home, configFilename),
        findUp(configFilename, { cwd })
    ];
}

async function loadFiles({ name, paths, loaders }) {
    const configPaths = getConfigPaths({ name, paths });

    const files = [];
    for await (const filename of configPaths) {
        try {
            files.push(
                loaders.reduce(async (acc, loader) => await loader(acc, filename),
                parse(await readFile(filename, { encoding: 'utf8' }))));
        } catch {}
    }

    return files;
}

async function loadArgs({ argv, loaders }) {
    let args = { _: [], '--': [] };

    let i = 0;
    while (i < argv.length) {
        if (isFlag(argv[i])) {
            if (isFlag(argv[i + 1]) || argv[i + 1] == null || !argv[i + 1].length) {
                args[trim(argv[i++])] = true;
            } else {
                args[trim(argv[i++])] = cast(argv[i++]);
            }
        } else {
            args._.push(cast(argv[i++]));
        }
        args = sugarProcess(args);
    }

    return loaders.reduce(async (acc, loader) => await loader(acc), args);
}

async function loadEnv({ name, loaders }) {
    const prefix = `${name}_`;
    const env = Object.entries(process.env).reduce((acc, [ k, v ]) => {
        if (k.startsWith(prefix)) {
            let key;
            key = k.replace(prefix, '').replace('__', '.');
            acc[key] = v;
        }
        return acc;
    }, {});
    return loaders.reduce(async (acc, loader) => await loader(acc), sugarProcess(env));
}

function getUnfulfilled({ prompts, config }) {
    return prompts.reduce((acc, prompt) => {
        if (!has(config, prompt.name)) acc.push(prompt);
        return acc;
    }, []);
}

async function Answers(options = {}) {
    const {
        name = 'answers',
        loaders = [],
        defaults = {},
        prompts = [],
        argv = process.argv.slice(2),
        cwd = process.cwd(),
        home = process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME,
        etc = '/usr/local/etc'
    } = options;

    const paths = { cwd, home, etc };
    const files = await loadFiles({ name, paths, loaders });
    const args = await loadArgs({ argv, loaders });
    const env = await loadEnv({ name, loaders });

    const config = merge(defaults, ...files, env, args);

    const unfulfilledPrompts = getUnfulfilled({ prompts, config });
    const answers = sugarProcess(await inquirer.prompt(unfulfilledPrompts));

    return merge(config, answers);
}

function parse(str) {
    if (/^\s*{/.test(str)) {
        try {
            return edn(str);
        } catch {
            return JSON.parse(stripJsonComments(str));
        }
    }
    try {
        return yaml.parse(str);
    } catch {
        return ini.parse(str);
    }
}

if (require.main === module) (async () => console.log(await Answers()))();
