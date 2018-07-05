'use strict';

const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const set = require('lodash/set');

function expander(subject) {
    const keys = Object.keys(subject);
    const acc = isArray(subject) ? [] : {};
    return keys.reduce((acc, key) => {
        const value = subject[key];
        if (/\[\]$/.test(key)) {
            key = `${key.slice(0, -2)}[${(isArray(value) ? value.length - 1 : 0)}]`;
        }
        if (isObject(value)) {
            set(acc, key, expander(value));
        } else if (isArray(value)) {
            set(acc, key, value.map(expander));
        } else {
            set(acc, key, value);
        }
        return acc;
    }, acc);
}


module.exports = expander;
