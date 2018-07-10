'use strict';

const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const get = require('lodash/get');
const set = require('lodash/set');

function expander(subject) {
    return Object.keys(subject).reduce((acc, key) => {
        const value = subject[key];
        // handle prop[<int>].prop syntax (array index expand)
        if (/\[\d\]$/.test(key)) {
            const matches = /\[(\d)\]$/.exec(key);
            const idx = matches[1];
            const existing = get(acc, key, {});
            if (isObject(value)) {
                set(acc, key, expander({ ...existing, ...value }));
            } else if (isArray(value)) {
                set(acc, key, value.map(expander));
            } else {
                set(acc, key, value);
            }
        // handle prop[+] syntax (array push)
        } else if (/\[\+\]$/.test(key)) {
            const parentKey = key.slice(0, -3);
            const parent = get(acc, parentKey, []);
            if (isObject(value)) {
                parent.push(expander(value));
            } else if (isArray(value)) {
                value.forEach((v) => parent.push(expander(v)));
            } else {
                parent.push(value);
            }
            set(acc, parentKey, parent);
        // handle prop[-] syntax (array unshift)
        } else if (/\[-\]$/.test(key)) {
            const parentKey = key.slice(0, -3);
            const parent = get(acc, parentKey, []);
            if (isObject(value)) {
                parent.unshift(expander(value));
            } else if (isArray(value)) {
                value.forEach((v) => parent.unshift(expander(v)));
            } else {
                parent.unshift(value);
            }
            set(acc, parentKey, parent);
        // handle prop[<int>, <int>] syntax (array splice)
        } else if (/\[\d,\d\]$/.test(key)) {
            const matches = /\[(\d),(\d)\]$/.exec(key);
            const idx = matches[1];
            const rm = matches[2];
            const parentKey = key.slice(0, -5);
            const parent = get(acc, parentKey, []);
            if (isArray(value)) {
                value.forEach((v) => parent.splice(idx, rm, v));
            } else {
                parent.splice(idx, rm, value);
            }
            set(acc, parentKey, parent);
        // set objects via recurive call
        } else if (isObject(value)) {
            set(acc, key, expander(value));
        // set arrays via recurive map
        } else if (isArray(value)) {
            set(acc, key, value.map(expander));
        // set primitives
        } else {
            set(acc, key, value);
        }
        return acc;
    }, isArray(subject) ? [] : {});
}


module.exports = expander;
