'use strict';

import test from 'ava';
import Answers from '..';
import path from 'path';

const defaultFixture = 'all-sources';

async function setup(fixture = defaultFixture, user = 'jane', defaults = {}, argv = []) {
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
        argv
    });
}

test('all available sources should be loaded', async t => {
    t.deepEqual(await setup('all-sources', 'jane'), {
        name: 'testapp',
        'project-rc': 'project-rc',
        'home-rc': 'home-rc',
        'home-config-testapp': 'home-config-testapp',
        'home-testapp-config': 'home-testapp-config',
        'system-rc': 'system-rc',
        'system-testapp-config': 'system-testapp-config'
    });
    t.deepEqual(await setup('all-sources', 'peter'), {
        name: 'testapp',
        'project-rc': 'project-rc',
        'home-rc': 'home-rc',
        'home-config-testapp-config': 'home-config-testapp-config',
        'home-testapp-config': 'home-testapp-config',
        'system-rc': 'system-rc',
        'system-testapp-config': 'system-testapp-config'
    });
});

test('merge precendence for sourced config should be in order where most locally available config is weighed strongest', async t => {
    t.deepEqual(await setup('all-sources-precedence', 'jane'), {
        name: 'testapp',
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
        f: 'system-testapp-config'
    });
    t.deepEqual(await setup('all-sources-precedence', 'peter'), {
        name: 'testapp',
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
        f: 'system-testapp-config'
    });
});
