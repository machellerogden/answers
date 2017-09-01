'use strict';
const fs = require('fs');
const ini = require('ini');
const path = require('path');
const stripJsonComments = require('strip-json-comments');

const parse = exports.parse = (content) => {
    if (/^\s*{/.test(content)) return JSON.parse(stripJsonComments(content));
    return ini.parse(content);
};

const file = exports.file = (...a) => {
    const args = [].slice.call(a).filter(function (arg) { return arg != null; });
    for (let i in args) {
        if ('string' !== typeof args[i]) return;
    }
    const file = path.join.apply(null, args);
    try {
        return fs.readFileSync(file, 'utf-8');
    } catch (err) {
        return;
    }
};

exports.json = (...a) => {
    const content = file.apply(null, a);
    return content ? parse(content) : null;
};

exports.env = (prefix, env) => {
    env = env || process.env;
    const obj = {};
    const l = prefix.length;
    for (let k in env) {
        if (k.toLowerCase().indexOf(prefix.toLowerCase()) === 0) {
            let keypath = k.substring(l).split('__');
            let _emptyStringIndex;
            while ((_emptyStringIndex=keypath.indexOf('')) > -1) {
                keypath.splice(_emptyStringIndex, 1);
            }
            let cursor = obj;
            keypath.forEach(function _buildSubObj(_subkey, i) {
                if (!_subkey || typeof cursor !== 'object') {
                    return;
                }
                if (i === keypath.length-1) {
                    cursor[_subkey] = env[k];
                }
                if (cursor[_subkey] === undefined) {
                    cursor[_subkey] = {};
                }
                cursor = cursor[_subkey];
            });
        }
    }

    return obj;
};

exports.find = (...a) => {
    const rel = path.join.apply(null, [].slice.call(a));

    function find(start, rel) {
        const file = path.join(start, rel);
        try {
            fs.statSync(file);
            return file;
        } catch (err) {
            if (path.dirname(start) !== start) {
                return find(path.dirname(start), rel);
            }
        }
    }
    return find(process.cwd(), rel);
};

