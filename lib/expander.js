'use strict';

const reduce = require('lodash/reduce');
const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const keypath = require('keypather')();

function isKeyed(value) {
    return reduce(value, (a, v, k) => {
        if (/[\[\]\.]/.test(k)) {
            return true;
        } else {
            return a || false;
        }
    }, false);
}

function expander(subject) {
    const accumulator = isArray(subject) ? [] : {};
    return reduce(subject, (acc, value, key) => {
        if (isKeyed(value)) value = keypath.expand(value);
        if (isObject(value) || isArray(value)) value = expander(value);
        acc[key] = value;
        return acc;
    }, accumulator);
}


module.exports = expander;
