'use strict';

import test from 'ava';
import Answers from '../index.js';
import path from 'path';

test('fixture a', async t => {
    const mockCwd = path.join(__dirname, 'fixtures/a/projects/test-project');
    const mockHome = path.join(__dirname, 'fixtures/a/Users/jane');
    const mockEtc = path.join(__dirname, 'fixtures/a/etc');
    const answers = await Answers({
        name: 'testapp',
        cwd: mockCwd,
        home: mockHome,
        etc: mockEtc
    })
    t.deepEqual(answers, {
        name: 'testapp',
        project: 'project',
        home: 'home',
        system: 'system'
    });
});
