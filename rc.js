'use strict';

module.exports = Rc;

const minimist = require('./minimist');
const utils = require('./lib/utils');
const join = require('path').join;
const { merge } = require('sugarmerge');
const etc = '/etc';
const win = process.platform === 'win32';

function Rc({ name, argv, prefix, root = '/', home, cwd = process.cwd() }) {
    if ('string' !== typeof name) throw new Error('name must be a string');

    argv = minimist((argv
        ? argv
        : process.argv.slice(2)), { prefix });

    const env = utils.env(name + '_');

    home = home
        ? home
        : win
            ? process.env.USERPROFILE
            : process.env.HOME;

    const { sources, configs } = [
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
        ...orArray(env.config, [ env.config ])
    ].reduce(reduceConfig, { sources: [], configs: [], configFiles: [] });

    const result = {};

    result['--'] = argv['--'];
    result._ = argv._;

    result.config = merge({}, ...[
        ...configs,
        env,
        argv.config
    ]);

    result.sources = [
        ...sources,
        {
            type: 'env',
            config: env
        },
        {
            type: 'argv',
            config: argv.config
        }
    ];

    return result;
}

function reduceConfig(acc, file) {
    if (acc.configFiles.indexOf(file) >= 0) return acc;
    const fileConfig = utils.file(file);
    if (fileConfig) {
        const c = utils.parse(fileConfig);
        acc.sources.push({ source: file, type: 'file', config: c });
        acc.configs.push(c);
        acc.configFiles.push(file);
    }
    return acc;
}

function orArray(truthy, maybeArr) {
    return truthy && maybeArr || [];
}
