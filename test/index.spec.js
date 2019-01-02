'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const Answers = require('..');
const path = require('path');

describe('answers', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    it('new', () => {
        const root = path.join(__dirname, 'fixtures');
        const home = path.normalize('/Users/jdoe');
        const cwd = path.join(root, home, 'test-project');
        return Answers({
            name: 'foo',
            root,
            home,
            cwd,
            argv: [ 'bar', '--', 'qux' ]
        }).get().then(config => {
            return expect(config).to.eql({
                "--": [
                    "qux"
                ],
                "_": [
                    "bar"
                ],
                "__sources__": {
                    [path.join(process.cwd(), "test/fixtures/Users/jdoe/.foorc")]: {
                        "someprop": "user"
                    },
                    [path.join(process.cwd(), "test/fixtures/Users/jdoe/test-project/.foorc")]: {
                        "someprop": "local"
                    },
                    [path.join(process.cwd(), "test/fixtures/etc/foorc")]: {
                        "someprop": "system"
                    }
                },
                someprop: "local"
            });
        });
    });

    afterEach(() => sandbox.restore());

});
