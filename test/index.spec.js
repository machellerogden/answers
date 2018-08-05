'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
//const inquirer = require('inquirer');
//var proxyquire = require('proxyquire').noPreserveCache();

// Sorry folks. I'll backfill these someday.
describe('answers', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    it.skip('foo', () => {
        expect(true).to.be(true);
    });

    afterEach(() => {
        sandbox.restore();
    });

});
