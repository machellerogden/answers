'use strict';

const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const get = require('lodash/get');
const set = require('lodash/set');

function expander(subject) {
    const keys = Object.keys(subject);
    const acc = isArray(subject) ? [] : {};
    return keys.reduce((acc, key) => {
        const value = subject[key];
        if (/\[\+\]$/.test(key)) {
            const parentKey = key.slice(0, -3);
            const parent = get(acc, parentKey, []);
            let idx = (isArray(parent) && parent.length > 0)
                ? parent.length
                : 0;
            if (isArray(value)) {
                value.forEach((v) => {
                    set(acc, `${parentKey}[${idx}]`, v);
                    idx++;
                });
            } else {
                set(acc, `${parentKey}[${idx}]`, value);
            }
        } else if (/\[-\]$/.test(key)) {
            const parentKey = key.slice(0, -3);
            const parent = get(acc, parentKey, []);
            if (isArray(value)) {
                value.forEach((v) => {
                    parent.unshift(v);
                    set(acc, parentKey, parent);
                });
            } else {
                parent.unshift(value);
                set(acc, key, value);
            }
        } else if (/\[\d,\d\]$/.test(key)) {
            const matches = /\[(\d),(\d)\]$/.exec(key);
            const idx = matches[1];
            const rm = matches[2];
            const parentKey = key.slice(0, -5);
            const parent = get(acc, parentKey, []);
            if (isArray(value)) {
                value.forEach((v) => {
                    parent.splice(idx, rm, v);
                    set(acc, parentKey, parent);
                });
            } else {
                parent.splice(idx, rm, value);
                set(acc, key, value);
            }
        } else if (isObject(value)) {
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
