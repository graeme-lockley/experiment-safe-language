"use strict";

var Tuple = require("../../src/core/Tuple");
var Chai = require("../../bower_components/chai/chai");

var expect = Chai.expect;

describe('Core/Tuple', function () {
    describe('given a tuple of (10, "abc")', function () {
        var tuple = Tuple.Tuple(10, 'abc');

        it('fst should return 10', function () {
            expect(Tuple.fst(tuple)).to.equal(10);
        });
        it('snd should return "abc"', function () {
            expect(Tuple.snd(tuple)).to.equal('abc');
        });

        describe('setFst(20) on tuple', function() {
            var tuple2 = Tuple.setFst(20, tuple);

            it('fst should return 20', function () {
                expect(Tuple.fst(tuple2)).to.equal(20);
            });
            it('snd should return "abc"', function () {
                expect(Tuple.snd(tuple2)).to.equal('abc');
            });
        });

        describe('setSnd(100) on tuple', function() {
            var tuple2 = Tuple.setSnd(100, tuple);

            it('fst should return 10', function () {
                expect(Tuple.fst(tuple2)).to.equal(10);
            });
            it('snd should return 100', function () {
                expect(Tuple.snd(tuple2)).to.equal(100);
            });
        });
    });
});