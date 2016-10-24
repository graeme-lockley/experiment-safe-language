"use strict";

const Cursor = require("./Cursor");

const Maybe = require('../core/Maybe');
const Record = require('../core/Record');
const String = require('../core/String');
const Tuple = require('../core/Tuple');

const TokenEnum = {
    UNKNOWN: 0,
    EOF: 1,

    IDENTIFIER: 2,

    CONSTANT_INTEGER: 3,
    CONSTANT_STRING: 4,
    CONSTANT_CHAR: 5,
    CONSTANT_URL: 6,

    AMPERSAND_AMPERSAND: 7,
    BANG: 8,
    BANG_EQUAL: 9,
    BAR_BAR: 10,
    EQUAL: 11,
    EQUAL_EQUAL: 12,
    GREATER: 13,
    GREATER_EQUAL: 14,
    LAMBDA: 15,
    LEFT_CURLY: 16,
    LESS: 17,
    LESS_EQUAL: 18,
    LEFT_PAREN: 19,
    MINUS: 20,
    MINUS_GREATER: 21,
    PERIOD: 22,
    PLUS: 23,
    PLUS_PLUS: 24,
    RIGHT_CURLY: 25,
    RIGHT_PAREN: 26,
    SEMICOLON: 27,
    SLASH: 28,
    STAR: 29,

    AS: 30,
    ASSUMPTIONS: 31,
    ELSE: 32,
    FALSE: 33,
    IF: 34,
    IMPORT: 35,
    O: 36,
    THEN: 37,
    TRUE: 38
};


const symbols = [
    Tuple.Tuple('\\')(TokenEnum.LAMBDA),
    Tuple.Tuple('.')(TokenEnum.PERIOD),
    Tuple.Tuple('(')(TokenEnum.LEFT_PAREN),
    Tuple.Tuple(')')(TokenEnum.RIGHT_PAREN),
    Tuple.Tuple('{')(TokenEnum.LEFT_CURLY),
    Tuple.Tuple('}')(TokenEnum.RIGHT_CURLY),
    Tuple.Tuple('==')(TokenEnum.EQUAL_EQUAL),
    Tuple.Tuple('=')(TokenEnum.EQUAL),
    Tuple.Tuple(';')(TokenEnum.SEMICOLON),
    Tuple.Tuple('++')(TokenEnum.PLUS_PLUS),
    Tuple.Tuple('+')(TokenEnum.PLUS),
    Tuple.Tuple('->')(TokenEnum.MINUS_GREATER),
    Tuple.Tuple('-')(TokenEnum.MINUS),
    Tuple.Tuple('<=')(TokenEnum.LESS_EQUAL),
    Tuple.Tuple('<')(TokenEnum.LESS),
    Tuple.Tuple('>=')(TokenEnum.GREATER_EQUAL),
    Tuple.Tuple('>')(TokenEnum.GREATER),
    Tuple.Tuple('*')(TokenEnum.STAR),
    Tuple.Tuple('/')(TokenEnum.SLASH),
    Tuple.Tuple('!=')(TokenEnum.BANG_EQUAL),
    Tuple.Tuple('!')(TokenEnum.BANG),
    Tuple.Tuple('||')(TokenEnum.BAR_BAR),
    Tuple.Tuple('&&')(TokenEnum.AMPERSAND_AMPERSAND)
];


const reservedIdentifiers = {
    'as': TokenEnum.AS,
    'assumptions': TokenEnum.ASSUMPTIONS,
    'else': TokenEnum.ELSE,
    'false': TokenEnum.FALSE,
    'if': TokenEnum.IF,
    'import': TokenEnum.IMPORT,
    'o': TokenEnum.O,
    'then': TokenEnum.THEN,
    'true': TokenEnum.TRUE
};

function isWhitespace(c) {
    return c <= 32;
}

function isDigit(c) {
    return c >= 48 && c <= 57;
}

function isIdentifierStart(c) {
    return c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0) ||
        c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0) ||
        c == '_'.charCodeAt(0);
}

function isIdentifierRest(c) {
    return c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0) ||
        c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0) ||
        c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0) ||
        c == '_'.charCodeAt(0) || c == '\''.charCodeAt(0);
}

function newLexer(input) {
    return id => x => y => index => indexX => indexY => indexXY => text => Record.mk9
        ("input")(input)
        ("_id")(id)
        ("_x")(x)
        ("_y")(y)
        ("index")(index)
        ("indexX")(indexX)
        ("indexY")(indexY)
        ("_indexXY")(indexXY)
        ("_text")(text);
}



function oneOf(predicate) {
    return cursor => {
        if (Cursor.is(predicate)(cursor)) {
            return Maybe.Just(Cursor.advanceIndex(cursor));
        } else {
            return Maybe.Nothing;
        }
    }
}

function many(parser) {
    return cursor => {
        let runner = Maybe.Just(cursor);
        while (true) {
            const nextRunner = parser(Maybe.withDefault()(runner));
            if (Maybe.isJust(nextRunner)) {
                runner = nextRunner;
            } else {
                return runner;
            }
        }
    };
}


function skipWhiteSpace(cursor) {
    return many(oneOf(isWhitespace))(cursor);
}


const tokenPatterns = [
    Tuple.Tuple (/[0-9]+/iy) (text => TokenEnum.CONSTANT_INTEGER),
    Tuple.Tuple (/file:(\\.|[^\s])+/iy) (text => TokenEnum.CONSTANT_URL),
    Tuple.Tuple (/[A-Za-z_][A-Za-z0-9_']*/iy) (text => {
        const reserved = reservedIdentifiers[text];

        return reserved
            ? reserved
            : TokenEnum.IDENTIFIER;
    })
];


function next(lexer) {
    if (lexer._id == TokenEnum.EOF) {
        return lexer;
    } else {
        let cursor = Maybe.withDefault()(skipWhiteSpace(Cursor.createCursor(lexer)));

        if (Cursor.isEndOfFile(cursor)) {
            return newContext(lexer)(TokenEnum.EOF)(cursor);
        } else {
            let tmpCursor = Cursor.markStartOfToken (cursor);
            for (let lp = 0; lp < tokenPatterns.length; lp += 1) {
                const pattern = tokenPatterns[lp];
                const patternRegEx = Tuple.first (pattern);

                patternRegEx.lastIndex = tmpCursor.index;
                const searchResult = patternRegEx.exec(tmpCursor.content);

                if (searchResult) {
                    for (let count = 0; count < searchResult[0].length; count += 1) {
                        tmpCursor = Cursor.advanceIndex (tmpCursor);
                    }
                    return newContext(lexer)(Tuple.second(pattern)(Cursor.text(tmpCursor)))(tmpCursor);
                }
            }
            if (Cursor.isChar("'")(cursor)) {
                cursor = Cursor.markStartOfToken(cursor);
                cursor = Cursor.advanceIndex(cursor);
                if (Cursor.isChar('\\')(cursor)) {
                    cursor = Cursor.advanceIndex(cursor);
                    cursor = Cursor.advanceIndex(cursor);
                    if (Cursor.isChar("'")(cursor)) {
                        cursor = Cursor.advanceIndex(cursor);
                        return newContext(lexer)(TokenEnum.CONSTANT_CHAR)(cursor);
                    } else {
                        return newContext(lexer)(TokenEnum.UNKNOWN)(cursor);
                    }
                } else {
                    cursor = Cursor.advanceIndex(cursor);
                    if (Cursor.isChar("'")(cursor)) {
                        cursor = Cursor.advanceIndex(cursor);
                        return newContext(lexer)(TokenEnum.CONSTANT_CHAR)(cursor);
                    } else {
                        return newContext(lexer)(TokenEnum.UNKNOWN)(cursor);
                    }
                }
            } else if (Cursor.isChar('"')(cursor)) {
                cursor = Cursor.markStartOfToken(cursor);
                cursor = Cursor.advanceIndex(cursor);
                while (Cursor.isNotChar('"')(cursor)) {
                    if (Cursor.isChar('\\')(cursor)) {
                        cursor = Cursor.advanceIndex(cursor);
                    }
                    cursor = Cursor.advanceIndex(cursor);
                }
                if (Cursor.isEndOfFile(cursor)) {
                    return newContext(lexer)(TokenEnum.UNKNOWN)(cursor);
                } else {
                    cursor = Cursor.advanceIndex(cursor);
                    return newContext(lexer)(TokenEnum.CONSTANT_STRING)(cursor);
                }
            } else {
                for (let index = 0; index < symbols.length; index += 1) {
                    const symbol = symbols[index];

                    if (Tuple.first(symbol).charCodeAt(0) == Cursor.charCodeAtIndex(cursor)) {
                        if (Tuple.first(symbol).length == 1) {
                            cursor = Cursor.markStartOfToken(cursor);
                            cursor = Cursor.advanceIndex(cursor);

                            return newContext(lexer)(Tuple.second(symbol))(cursor);
                        } else {
                            let tmpCursor = cursor;
                            let matched = true;

                            tmpCursor = Cursor.markStartOfToken(tmpCursor);
                            tmpCursor = Cursor.advanceIndex(tmpCursor);
                            for (let tmpCursorIndex = 1; tmpCursorIndex < Tuple.first(symbol).length; tmpCursorIndex += 1) {
                                matched = matched && Tuple.first(symbol).charCodeAt(tmpCursorIndex) == Cursor.charCodeAtIndex(tmpCursor);
                                tmpCursor = Cursor.advanceIndex(tmpCursor);
                            }

                            if (matched) {
                                return newContext(lexer)(Tuple.second(symbol))(tmpCursor);
                            }
                        }
                    }
                }

                cursor = Cursor.markStartOfToken(cursor);
                cursor = Cursor.advanceIndex(cursor);

                return newContext(lexer)(TokenEnum.UNKNOWN)(cursor);
            }
        }
    }
}

function newContext(context) {
    return id => cursor => newLexer(context.input)(id)(cursor.x)(cursor.y)(cursor.index)(cursor.indexX)(cursor.indexY)(cursor._indexXY)(Cursor.text(cursor));
}


function initialContext(input) {
    return sourceName => {
        const lexerInput = Record.mk3
            ("content")(input)
            ("length")(input.length)
            ("sourceName")(sourceName);
        return next(newLexer(lexerInput)(0)(1)(1)(0)(1)(1)(0)(''));
    }
}

module.exports = {
    initialContext,
    next,
    TokenEnum
};