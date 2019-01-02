'use strict';

module.exports = Rc;

const minimist = require('./minimist');
const utils = require('./lib/utils');
const join = require('path').join;
const { merge } = require('sugarmerge');
const etc = '/etc';
const win = process.platform === 'win32';

function Rc(name, argv, prefix, root = '/', homePath, cwdPath) {
    if ('string' !== typeof name) throw new Error('name must be a string');
    argv = minimist((argv
        ? argv
        : process.argv.slice(2)), { prefix });
    const env = utils.env(name + '_');
    const home = homePath
        ? homePath
        : win
            ? process.env.USERPROFILE
            : process.env.HOME;
    const cwd = cwdPath || process.cwd();

    const { sources, configs, configFiles } = [
        ...orArray(!win, [
            join(root, etc, name, 'config'),
            join(root, etc, name + 'rc')
        ]),
        ...orArray(home, [
            join(root, home, '.config', name, 'config'),
            join(root, home, '.config', name),
            join(root, home, '.' + name, 'config'),
            join(root, home, '.' + name + 'rc')
        ]),
        utils.find(cwd)(`.${name}rc`),
        ...orArray(env.config, [ env.config ]),
        ...orArray(argv.config, [ argv.config ])
    ].reduce(reduceConfig, { sources: {}, configs: [], configFiles: [] });

    const result = merge({}, ...[
        ...configs,
        env,
        argv
    ]);

    if (configFiles.length) {
        result.__sources__ = sources;
    }

    return result;
}

function reduceConfig(acc, file) {
    if (acc.configFiles.indexOf(file) >= 0) return acc;
    const fileConfig = utils.file(file);
    if (fileConfig) {
        const c = utils.parse(fileConfig);
        acc.sources[file] = c;
        acc.configs.push(c);
        acc.configFiles.push(file);
    }
    return acc;
}

function orArray(truthy, maybeArr) {
    return truthy && maybeArr || [];
}
