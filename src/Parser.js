"use strict";

const Result = require('./core/Result');
const Lexer = require('./Lexer');
const Tuple = require('./core/Tuple');
const AST = require('./AST');

const P = require('./core/ParserCombinators');


/**
 * EXPR :== TERM { TERM }
 * TERM :== CONSTANT_INTEGER
 *        | IDENTIFIER
 *        | '\\' IDENTIFIER { '\\' IDENTIFIER } '->' EXPR
 *        | '(' EXPR ')'
 */


function compose(f1, f2) {
    return x => f1(f2(x));
}


function parseConstantInteger(lexer) {
    return P.mapError(
        P.symbol(Lexer.TokenEnum.CONSTANT_INTEGER, compose(AST.newConstantInteger, parseInt))(lexer),
        "Expected a constant integer"
    );
}


function parseIdentifier(lexer) {
    return P.mapError(
        P.symbol(Lexer.TokenEnum.IDENTIFIER, AST.newIdentifier)(lexer),
        "Expected an identifier"
    );
}


function parseConstantIdentifier(name) {
    return lexer => {
        const result = P.symbol(Lexer.TokenEnum.IDENTIFIER, AST.newIdentifier)(lexer);

        return result.map(
            ok => lexer.token.text == name ? result : Result.Error("Expected " + name),
            error => Result.Error("Expected " + name));
    };
}


function parseLambda(lexer) {
    return P.parseAnd([
        P.many1(
            P.parseAnd([P.symbol(Lexer.TokenEnum.LAMBDA), P.symbol(Lexer.TokenEnum.IDENTIFIER)], elements => elements[1])),
        parseConstantIdentifier("->"),
        parseExpr
    ], items => AST.newLambda(items[0], items[2]))(lexer);
}


function parseParenthesisExpression(lexer) {
    return P.parseAnd([
        P.symbol(Lexer.TokenEnum.LPAREN),
        parseExpr,
        P.symbol(Lexer.TokenEnum.RPAREN)], elements => elements[1])(lexer);
}


function parseExpr(lexer) {
    return parseTerm(lexer);
}


function parseTerm(lexer) {
    return P.parseOr([parseConstantInteger, parseIdentifier, parseLambda, parseParenthesisExpression])(lexer);
}


function parseString(input) {
    const parseResult = parseExpr(Lexer.fromString(input));

    return parseResult.map(
        ok => Result.Ok(ok.fst),
        error => parseResult
    );
}


module.exports = {
    parseString, parseTerm
};