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

async function Answers(config = {}) {
    const {
        name = 'answers',
        loaders:customLoaders,
        merge:customMerge
    } = config;
    const configFilename = `.${name}rc`;
    const configPaths = [
        await findUp(configFilename),
        path.join(home, configFilename),
        path.join('/etc', configFilename)
    ];
    const fileString = configPaths.some(async (filename) => {
        const file = await readFile(filename, { encoding: 'utf8' });
        if (file) return file;
        return false;
    });
    console.log(fileString);
}

Answers();
