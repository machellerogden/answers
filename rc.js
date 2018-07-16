'use strict';

module.exports = Rc;

const minimist = require('minimist');
const utils = require('./lib/utils');
const join = require('path').join;
const composer = require('./lib/composer');
const etc = '/etc';
const win = process.platform === 'win32';
const home = win
    ? process.env.USERPROFILE
    : process.env.HOME;

function Rc(name, argv) {
    if ('string' !== typeof name) throw new Error('name must be a string');
    if (!argv) argv = minimist(process.argv.slice(2));
    const env = utils.env(name + '_');

    const { configs, configFiles } = [
        ...orArray(!win, [
            join(etc, name, 'config'),
            join(etc, name + 'rc')
        ]),
        ...orArray(home, [
            join(home, '.config', name, 'config'),
            join(home, '.config', name),
            join(home, '.' + name, 'config'),
            join(home, '.' + name + 'rc')
        ]),
        utils.find(`.${name}rc`),
        ...orArray(env.config, [ env.config ]),
        ...orArray(argv.config, [ argv.config ])
    ].reduce(reduceConfig, { configs: [], configFiles: [] });

    return composer(...[
        ...configs,
        env,
        argv,
        ...orArray(configFiles.length, [ { configs: configFiles, config: configFiles[configFiles.length - 1] } ])
    ]);
}

function reduceConfig(acc, file) {
    if (acc.configFiles.indexOf(file) >= 0) return acc;
    const fileConfig = utils.file(file);
    if (fileConfig) {
        acc.configs.push(utils.parse(fileConfig));
        acc.configFiles.push(file);
    }
    return acc;
}

function orArray(truthy, maybeArr) {
    return truthy && maybeArr || [];
}
