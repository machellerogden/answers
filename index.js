#!/usr/bin/env node
'use strict';

module.exports = Answers;

const path = require('path');
const { promisify, inspect } = require('util');
const readFile = promisify(require('fs').readFile);
const findUp = require('find-up');

const inquirer = require('inquirer');
const { merge, process:sugarProcess } = require('sugarmerge');
const { isNumeric, has } = require('needful');

const edn = require('edn-to-js');
const { parse:json } = JSON;
const { parse:yaml } = require('yamljs');
const { parse:ini } = require('ini');
const parsers = { edn, json, yaml, ini };
const stripJsonComments = require('strip-json-comments');

async function Answers(options = {}) {
    // default options
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

    // load config sources
    const base = await loadFileConfig({ name, paths, loaders });
    const runtime = await loadArgvConfig({ base, argv });
    const env = await loadEnv({ name });
    const config = merge(defaults, env, runtime);

    // prompt user for missing config
    const unfulfilledPrompts = getUnfulfilled({ prompts, config });
    const answers = sugarProcess(await inquirer.prompt(unfulfilledPrompts));

    // put it all together
    return merge(config, answers);
}

function parse(str, filename) {
    let data;
    const _parse = type => {
        debug(`attemping ${type} parse of ${filename}`);
        data = parsers[type](str);
        debug(`successfully parsed ${filename} as ${type}`);
    };
    if (/^\s*{/.test(str)) {
        try {
            _parse('edn');
        } catch {
            _parse('json');
        }
    } else {
        try {
            _parse('yaml');
        } catch {
            _parse('ini');
        }
    }
    if (data == null) debug('unable to load config for', filename);
    return data;
}

async function loadFileConfig({ name, paths, loaders }) {
    const configPaths = getConfigPaths({ name, paths });

    const files = [];
    for await (const filename of configPaths) {
        try {
            files.push(
                loaders.reduce(async (acc, loader) => await loader(acc, filename),
                parse(await readFile(filename, { encoding: 'utf8' }), filename)));
        } catch {}
    }
    return merge(...(await Promise.all(files)));
}

async function loadArgvConfig({ base, argv }) {
    let args = { _: [], '--': [], ...base };

    let i = 0;
    let end = false;
    while (i < argv.length) {
        if (argv[i] === '--') {
            end = true;
            i++;
            continue;
        }
        if (end) {
            args['--'].push(argv[i++]);
            continue;
        }
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

    return args;
}

async function loadEnv({ name }) {
    const prefix = `${name}_`;
    const env = Object.entries(process.env).reduce((acc, [ k, v ]) => {
        if (k.startsWith(prefix)) {
            let key;
            key = k.replace(prefix, '').replace('__', '.');
            acc[key] = v;
        }
        return acc;
    }, {});
    return env;
}

function getUnfulfilled({ prompts, config }) {
    return prompts.reduce((acc, prompt) => {
        if (!has(config, prompt.name)) acc.push(prompt);
        return acc;
    }, []);
}

function getConfigPaths({ name, paths }) {
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

function cast(v) {
    return isNumeric(v)
        ? +v
        : [ 'true', 'false' ].includes(v)
            ? v === 'true' ? true : false
            : v;
}

function trim(v) {
    return /^--?(.+)/.exec(v)[1];
}

function isFlag(v) {
    return /^-.+/.test(v);
}

function debug(...args) {
    return process.env.ANSWERS_DEBUG
        && console.debug(...args.map(v => typeof v === 'object'
            ? inspect(v, { depth: null, colors: true })
            : v));
}


if (require.main === module) (async () => console.log(await Answers()))();
