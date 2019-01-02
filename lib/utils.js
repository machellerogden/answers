'use strict';
const fs = require('fs');
const ini = require('ini');
const path = require('path');
const stripJsonComments = require('strip-json-comments');
const YAML = require('yamljs');

const parse = exports.parse = (content) => {
    if (/^\s*{/.test(content)) return JSON.parse(stripJsonComments(content));
    try {
        return YAML.parse(content);
    } catch(e) {
        return ini.parse(content);
    }
};

const file = exports.file = (...a) => {
    const args = a.filter((arg) => arg != null);
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
    return content
        ? parse(content)
        : null;
};

exports.env = (prefix, env) => {
    env = env || process.env;
    const obj = {};
    const l = prefix.length;
    for (let k in env) {
        if (k.toLowerCase().includes(prefix.toLowerCase())) {
            let keypath = k.substring(l).split('__');
            let _emptyStringIndex;
            while ((_emptyStringIndex = keypath.indexOf('')) > -1) {
                keypath.splice(_emptyStringIndex, 1);
            }
            let cursor = obj;
            keypath.forEach((s, i) => {
                if (!s || typeof cursor !== 'object') return;
                if (i === keypath.length - 1) cursor[s] = env[k];
                if (cursor[s] == null) cursor[s] = {};
                cursor = cursor[s];
            });
        }
    }
    return obj;
};

exports.find = (cwd = process.cwd()) => (...a) => {
    const rel = path.join.apply(null, a);

    function find(start, rel) {
        const file = path.join(start, rel);
        try {
            fs.statSync(file);
            return file;
        } catch (err) {
            if (path.dirname(start) !== start) return find(path.dirname(start), rel);
        }
    }
    return find(cwd, rel);
};

