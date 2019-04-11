'use strict';

import test from 'ava';
import Answers from '..';
import path from 'path';

async function setup({ fixture = 'all-sources', user = 'jane', defaults = {}, argv = [], loaders = [] }) {
    const name = 'testapp';
    const fixtureBase = path.join(__dirname, `fixtures/${fixture}`);
    const cwd = path.join(fixtureBase, '/projects/test-project');
    const home = path.join(fixtureBase, `/Users/${user}`);
    const etc = path.join(fixtureBase, '/etc');
    return await Answers({
        name,
        defaults,
        cwd,
        home,
        etc,
        argv,
        loaders
    });
}

test('all available sources should be loaded', async t => {
    t.deepEqual(await setup({ fixture: 'all-sources', user: 'jane' }), {
        name: 'testapp',
        '--': [],
        _: [],
        'project-rc': 'project-rc',
        'home-rc': 'home-rc',
        'home-config-testapp': 'home-config-testapp',
        'home-testapp-config': 'home-testapp-config',
        'system-rc': 'system-rc',
        'system-testapp-config': 'system-testapp-config'
    });
    t.deepEqual(await setup({ fixture: 'all-sources', user: 'peter' }), {
        name: 'testapp',
        '--': [],
        _: [],
        'project-rc': 'project-rc',
        'home-rc': 'home-rc',
        'home-config-testapp-config': 'home-config-testapp-config',
        'home-testapp-config': 'home-testapp-config',
        'system-rc': 'system-rc',
        'system-testapp-config': 'system-testapp-config'
    });
});

test('merge precendence for sourced config should be in order where most locally available config is weighed strongest', async t => {
    const argv = [ '--load-order[+]', 'command-line', '--', 'do-not-parse[+]', 'true', '123' ];
    t.deepEqual(await setup({ fixture: 'all-sources-precedence', user: 'jane', argv }), {
        name: 'testapp',
        '--': [ 'do-not-parse[+]', 'true', '123' ],
        _: [],
        'project-rc': 'project-rc',
        'home-rc': 'home-rc',
        'home-config-testapp': 'home-config-testapp',
        'home-testapp-config': 'home-testapp-config',
        'system-rc': 'system-rc',
        'system-testapp-config': 'system-testapp-config',
        a: 'project-rc',
        b: 'home-rc',
        c: 'home-testapp-config',
        d: 'home-config-testapp',
        e: 'system-rc',
        f: 'system-testapp-config',
        "load-order": [
            'system-testapp-config',
            'system-rc',
            'home-config-testapp',
            'home-testapp-config',
            'home-rc',
            'project-rc',
            'command-line'
        ]
    });
    t.deepEqual(await setup({ fixture: 'all-sources-precedence', user: 'peter', argv }), {
        name: 'testapp',
        '--': [ 'do-not-parse[+]', 'true', '123' ],
        _: [],
        'project-rc': 'project-rc',
        'home-rc': 'home-rc',
        'home-config-testapp-config': 'home-config-testapp-config',
        'home-testapp-config': 'home-testapp-config',
        'system-rc': 'system-rc',
        'system-testapp-config': 'system-testapp-config',
        a: 'project-rc',
        b: 'home-rc',
        c: 'home-testapp-config',
        d: 'home-config-testapp-config',
        e: 'system-rc',
        f: 'system-testapp-config',
        "load-order": [
            'system-testapp-config',
            'system-rc',
            'home-config-testapp-config',
            'home-testapp-config',
            'home-rc',
            'project-rc',
            'command-line'
        ]
    });
});

test('config can be edn, json, yaml or ini', async t => {
    t.deepEqual(await setup({ fixture: 'mixed-types', user: 'jane' }), {
        name: 'testapp',
        '--': [],
        _: [],
        'project-rc': 'project-rc',
        'home-rc': 'home-rc',
        'home-config-testapp': 'home-config-testapp',
        'home-testapp-config': 'home-testapp-config',
        'system-rc': 'system-rc',
        'system-testapp-config': 'system-testapp-config',
        types: [
            'edn',
            'edn',
            'yaml',
            'json',
            'ini'
        ]
    });
    t.deepEqual(await setup({ fixture: 'mixed-types', user: 'peter' }), {
        name: 'testapp',
        '--': [],
        _: [],
        'project-rc': 'project-rc',
        'home-rc': 'home-rc',
        'home-config-testapp-config': 'home-config-testapp-config',
        'home-testapp-config': 'home-testapp-config',
        'system-rc': 'system-rc',
        'system-testapp-config': 'system-testapp-config',
        types: [
            'edn',
            'edn',
            'ini',
            'json',
            'yaml'
        ]
    });
});

test('specified loaders are applied to all file sources', async t => {
    let filenames = [];
    const fooify = (config, filename) => {
        filenames.push(filename);
        const result = Object.entries(config).reduce((acc, [ k, v ]) => {
            acc.foo[k] = v;
            return acc;
        }, { foo: {} });
        return result;
    };
    t.deepEqual(await setup({ fixture: 'all-sources', user: 'jane', loaders: [ fooify ], argv: [ '--bar', 'baz', '--foo.bar', 'baz' ] }), {
        '--': [],
        _: [],
        bar: 'baz',
        foo: {
            bar: 'baz',
            name: 'testapp',
            'project-rc': 'project-rc',
            'home-rc': 'home-rc',
            'home-config-testapp': 'home-config-testapp',
            'home-testapp-config': 'home-testapp-config',
            'system-rc': 'system-rc',
            'system-testapp-config': 'system-testapp-config'
        }
    });
    t.is(filenames.length, 6);
    t.assert(/etc\/testapp\/config$/.test(filenames[0]));
    t.assert(/etc\/.testapprc$/.test(filenames[1]));
    t.assert(/Users\/jane\/.config\/testapp$/.test(filenames[2]))
    t.assert(/Users\/jane\/.testapp\/config$/.test(filenames[3]))
    t.assert(/Users\/jane\/.testapprc$/.test(filenames[4]))
    t.assert(/projects\/.testapprc$/.test(filenames[5]))
});
