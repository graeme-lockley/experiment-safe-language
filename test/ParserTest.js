"use strict";

const Result = require('../src/core/Result');
const Tuple = require('../src/core/Tuple');
const Parser = require("../src/Parser");
const Lexer = require("../src/Lexer");
const AST = require('../src/AST');

const expect = require("chai").expect;

describe('Parser', function () {
    describe('given the input "123" to parseTerm', () => {
        const result = Parser.parseTerm(Lexer.fromString("123"));

        it("should parse without any errors", () =>
            expect(result.isOk()).to.equal(true));
        it("should parse a CONSTANT_INTEGER with value 123", () => {
            expect(result.getOkOrElse().fst).to.be.an.instanceOf(AST.ConstantInteger);
            expect(result.getOkOrElse().fst.value).to.equal(123);
        });
        it("should have the next token of EOF", () =>
            expect(result.getOkOrElse().snd.token.id).to.equal(Lexer.TokenEnum.EOF));
    });

    describe('given the input "abc 123" to parseTerm', () => {
        const result = Parser.parseTerm(Lexer.fromString("abc 123"));

        it("should parse without any errors", () =>
            expect(result.isOk()).to.equal(true));
        it('should parse an IDENTIFIER with value "abc"', () => {
            expect(result.getOkOrElse().fst).to.be.an.instanceOf(AST.Identifier);
            expect(result.getOkOrElse().fst.name).to.equal('abc');
        });
        it("should have the next token of CONSTANT_INTEGER", () =>
            expect(result.getOkOrElse().snd.token.id).to.equal(Lexer.TokenEnum.CONSTANT_INTEGER));
    });

    describe('given the input "( 123)" to parseTerm', () => {
        const result = Parser.parseTerm(Lexer.fromString('( 123)'));

        it("should parse without any errors", ()=>
            expect(result.isOk(result)).to.equal(true));
        it("should parse a CONSTANT_INTEGER with value 123", () => {
            expect(result.getOkOrElse().fst).to.be.an.instanceOf(AST.ConstantInteger);
            expect(result.getOkOrElse().fst.value).to.equal(123);
        });
        it("should have the next token of EOF", () =>
            expect(result.getOkOrElse().snd.token.id).to.equal(Lexer.TokenEnum.EOF));
    });

    describe('given the input "\\a \\b -> (a)" to parseTerm', () => {
        const result = Parser.parseTerm(Lexer.fromString('\\a \\b -> (a)'));

        it("should parse without any errors", () => expect(result.isOk()).to.equal(true));
        it("should parse a LAMBDA with variables ['a', 'b'] and expression of IDENTIFIER with value 'a'", () => {
            expect(result.getOkOrElse().fst).to.be.an.instanceOf(AST.Lambda);
            expect(result.getOkOrElse().fst.variables.length).to.equal(2);
            expect(result.getOkOrElse().fst.variables[0]).to.equal('a');
            expect(result.getOkOrElse().fst.variables[1]).to.equal('b');
        });
        it("should have the next token of EOF", () =>
            expect(result.getOkOrElse().snd.token.id).to.equal(Lexer.TokenEnum.EOF));
    });
});
