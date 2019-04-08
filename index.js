#!/usr/bin/env node
'use strict';

module.exports = Answers;

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

const { isNumeric } = require('needful');
const isFlag = v => /^-.+/.test(v);

const cast = v => isNumeric(v)
    ? +v
    : [ 'true', 'false' ].includes(v)
        ? v === 'true' ? true : false
        : v;

const trim = v => /^--?(.+)/.exec(v)[1];

async function loadSources({ name, defaults, cwd, home, etc, loaders }) {

    const configFilename = `.${name}rc`;
    const configPaths = [
        path.join(etc, name, 'config'),
        path.join(etc, configFilename),
        path.join(home, '.config', name, 'config'),
        path.join(home, '.config', name),
        path.join(home, `.${name}`, 'config'),
        path.join(home, configFilename),
        findUp(configFilename, { cwd })
    ];

    const sources = [ defaults ];

    for await (const filename of configPaths) {
        try {
            sources.push(
                // TODO: support async loaders
                loaders.reduce((acc, loader) => loader(acc, filename),
                parse(await readFile(filename, { encoding: 'utf8' }))));
        } catch {}
    }

    return sources;
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
        // TODO: support async loaders
        args = loaders.reduce((acc, loader) => loader(acc), sugarProcess(args));
    }

    return args;
}

async function Answers(config = {}) {
    const {
        name = 'answers',
        loaders = [],
        defaults = {},
        argv = process.argv.slice(2),
        cwd = process.cwd(),
        home = process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME,
        etc = '/usr/local/etc'
    } = config;

    const sources = await loadSources({ name, defaults, cwd, home, etc, loaders });

    const args = await loadArgs({ argv, loaders });

    return merge(...sources, args);
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

if (require.main === module) {
    (async () => console.log(await Answers()))();
}
