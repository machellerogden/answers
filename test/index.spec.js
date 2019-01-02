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

    it('the basics work', () => {

        const name = 'foo';
        const root = path.join(__dirname, 'fixtures');
        const home = path.normalize('/Users/jdoe');
        const cwd = path.join(root, home, 'test-project');
        const argv = [ '--anotherprop', 'command-line', 'bar', '--', '--qux', 'xyzzy' ];

        return Answers({
            name,
            root,
            home,
            cwd,
            argv
        }).get().then(config => {
            return expect(config).to.eql({
                "--": [
                    "--qux",
                    "xyzzy"
                ],
                "_": [
                    "bar"
                ],
                "config": {
                    "anotherprop": "command-line",
                    "someprop": "local"
                },
                "sources": [
                    {
                        "source": path.join(process.cwd(), "test/fixtures/etc/foorc"),
                        "type": "file",
                        "config": {
                            "someprop": "system"
                        }
                    },
                    {
                        "source": path.join(process.cwd(), "test/fixtures/Users/jdoe/.foorc"),
                        "type": "file",
                        "config": {
                            "someprop": "user"
                        }
                    },
                    {
                        "source": path.join(process.cwd(), "test/fixtures/Users/jdoe/test-project/.foorc"),
                        "type": "file",
                        "config": {
                            "someprop": "local"
                        }
                    },
                    {
                        "type": "env",
                        "config": {}
                    },
                    {
                        "type": "argv",
                        "config": {
                            "anotherprop": "command-line"
                        }
                    },
                    {
                        "type": "prompt",
                        "config": {}
                    }
                ]
            });
        });
    });

    it('can know source of prop', () => {

        const name = 'foo';
        const root = path.join(__dirname, 'fixtures');
        const home = path.normalize('/Users/jdoe');
        const cwd = path.join(root, home, 'test-project');
        const argv = [ '--anotherprop', 'command-line', 'bar', '--', '--qux', 'xyzzy' ];

        return Answers({
            name,
            root,
            home,
            cwd,
            argv
        }).get().then(config => {
            return expect(Answers.source('someprop', config)).to.eql({
                "source": path.join(process.cwd(), "test/fixtures/Users/jdoe/test-project/.foorc"),
                "type": 'file',
                "config": {
                    "someprop": "local"
                }
            });
        });
    });

    afterEach(() => sandbox.restore());

});
