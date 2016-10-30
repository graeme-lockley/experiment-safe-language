"use strict";

const AST = require('./AST');
const Array = require('../core/Array');
const Maybe = require("../core/Maybe");


const infixOperators = {
    '||': '(_$a => (_$b => (_$a || _$b)))',
    '&&': '(_$a => (_$b => (_$a && _$b)))',
    '==': '(_$a => (_$b => (_$a == _$b)))',
    '!=': '(_$a => (_$b => (_$a != _$b)))',
    '<': '(_$a => (_$b => (_$a < _$b)))',
    '<=': '(_$a => (_$b => (_$a <= _$b)))',
    '>': '(_$a => (_$b => (_$a > _$b)))',
    '>=': '(_$a => (_$b => (_$a >= _$b)))',
    '++': '(_$a => (_$b => (_$a + _$b)))',
    '+': '(_$a => (_$b => (_$a + _$b)))',
    '-': '(_$a => (_$b => (_$a - _$b)))',
    '*': '(_$a => (_$b => (_$a * _$b)))',
    '/': '(_$a => (_$b => (_$a / _$b)))'
};


function encodeString(s) {
    return s
        .replace('\n', '\\n')
        .replace('"', '\\"');
}



function simplifyPath(path) {
    let candidateResult = path;
    while (true) {
        const result = candidateResult.replace('/./', '/');
        if (result == candidateResult) {
            return result;
        } else {
            candidateResult = result;
        }
    }
}


module.exports = {
    infixOperators,
    encodeString,
    simplifyPath
};