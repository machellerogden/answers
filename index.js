#!/usr/bin/env node
'use strict';

module.exports = Answers;

const argv = process.argv.slice(2);
const home = process.platform === 'win32'
    ? process.env.USERPROFILE
    : process.env.HOME;

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
        loaders:customLoaders = []
    } = config;

    const loaders = [ ...customLoaders ];

    const configFilename = `.${name}rc`;
    const configPaths = [
        findUp(configFilename),
        path.join(home, configFilename),
        path.join('/usr/local/etc', configFilename),
        path.join('/etc', configFilename)
    ];

    const fileSources = [];
    for await (const filename of configPaths) {
        try {
            fileSources.push(
                loaders.reduce((acc, loader) => loader(acc, filename),
                parse(await readFile(filename, { encoding: 'utf8' }))));
        } catch {}
    }
    console.log(merge(...fileSources));
}

function parse(str) {
    if (/^\s*{/.test(str)) return JSON.parse(stripJsonComments(str));
    try {
        return yaml.parse(str);
    } catch {
        return ini.parse(str);
    }
}

if (process.stdin.isTTY) {
    Answers();
}
