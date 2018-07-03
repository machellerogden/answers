'use strict';

const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const keypath = require('keypather')();

function expander(subject) {
    const keys = Object.keys(subject);
    const acc = isArray(subject) ? [] : {};
    return keys.reduce((acc, key) => {
        const value = subject[key];
        if (isObject(value)) {
            keypath.set(acc, key, expander(value));
        } else if (isArray(value)) {
            keypath.set(acc, key, value.map(expander));
        } else {
            keypath.set(acc, key, value);
        }
        return acc;
    }, acc);
}


module.exports = expander;
