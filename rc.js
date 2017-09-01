'use strict';

const minimist = require('minimist');
const utils = require('./lib/utils');
const join = require('path').join;
const composer = require('./lib/composer');
const etc = '/etc';
const win = process.platform === "win32";
const home = win
        ? process.env.USERPROFILE
        : process.env.HOME;

module.exports = (name, argv) => {
    if ('string' !== typeof name) throw new Error('name must be a string');
    if (!argv) argv = minimist(process.argv.slice(2));
    const env = utils.env(name + '_');
    const configs = [];
    const configFiles = [];

    function addConfigFile (file) {
        if (configFiles.indexOf(file) >= 0) return;
        const fileConfig = utils.file(file);
        if (fileConfig) {
            configs.push(utils.parse(fileConfig));
            configFiles.push(file);
        }
    }

    if (!win) {
        [ join(etc, name, 'config'), join(etc, name + 'rc') ].forEach(addConfigFile);
    }

    if (home) {
        [ join(home, '.config', name, 'config'), join(home, '.config', name), join(home, '.' + name, 'config'), join(home, '.' + name + 'rc') ].forEach(addConfigFile);
    }

    addConfigFile(utils.find('.'+name+'rc'));

    if (env.config) addConfigFile(env.config);
    if (argv.config) addConfigFile(argv.config);

    return composer.apply(null, configs.concat([ env, argv, configFiles.length ? { configs: configFiles, config: configFiles[configFiles.length - 1] } : undefined ]));
};

if (!module.parent) {
    console.log(JSON.stringify(module.exports(process.argv[2]), false, 2));
}
