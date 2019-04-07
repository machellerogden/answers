#!/usr/bin/env node
'use strict';

module.exports = Answers;

const argv = process.argv.slice(2);
let cwd = process.cwd();
let home = process.platform === 'win32'
    ? process.env.USERPROFILE
    : process.env.HOME;
let etc = '/usr/local/etc';

const path = require('path');
const {
    readFile,
    constants
} = require('fs').promises;

const findUp = require('find-up');

const ini = require('ini');
const yaml = require('yamljs');
const stripJsonComments = require('strip-json-comments');
const { merge, process:p } = require('sugarmerge');

async function Answers(config = {}) {
    const {
        name = 'answers',
        loaders:customLoaders = [],
        defaults = {},
        cwd:customCwd,
        home:customHome,
        etc:customEtc
    } = config;

    const loaders = [ ...customLoaders ];

    cwd = customCwd || cwd;
    home = customHome || home;
    etc = customEtc || etc;

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

    const fileSources = [];
    for await (const filename of configPaths) {
        try {
            fileSources.push(
                loaders.reduce((acc, loader) => loader(acc, filename),
                parse(await readFile(filename, { encoding: 'utf8' }))));
        } catch {}
    }
    return merge(defaults, ...fileSources);
}

function parse(str) {
    if (/^\s*{/.test(str)) return JSON.parse(stripJsonComments(str));
    try {
        return yaml.parse(str);
    } catch {
        return ini.parse(str);
    }
}

if (require.main === module) {
    if (process.argv[2]) {
        Answers();
    }
}
