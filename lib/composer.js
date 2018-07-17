'use strict';

const isNil = require('lodash/isNil');
const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const forEach = require('lodash/forEach');
const reduce = require('lodash/reduce');

function composer(accumulator, ...args) {
    return reduce(args, (acc, arg) => {
        forEach(arg, (v, k) => {
            if (isArray(v)) {
                acc[k] = composer(acc[k] || [], v);
            } else if (isObject(v)) {
                acc[k] = composer(acc[k] || {}, v);
            } else if (!isNil(v)) {
                acc[k] = v;
            }
        });
        return acc;
    }, accumulator);
}

module.exports = composer;
