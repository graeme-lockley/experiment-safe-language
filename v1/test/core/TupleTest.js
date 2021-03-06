"use strict";

const Tuple = require("../../src/core/Tuple");
const expect = require("chai").expect;

describe('Core/Tuple', function () {
    describe('given a tuple of (10, "abc")', () => {
        const tuple = Tuple.Tuple(10, 'abc');

        it('fst should return 10', () => expect(tuple.fst).to.equal(10));
        it('snd should return "abc"', () => expect(tuple.snd).to.equal('abc'));

        describe('setFst(20) on tuple', () => {
            const tuple2 = tuple.setFst(20);

            it('fst should return 20', () => expect(tuple2.fst).to.equal(20));
            it('snd should return "abc"', () => expect(tuple2.snd).to.equal('abc'));
        });

        describe('setSnd(100) on tuple', () => {
            const tuple2 = tuple.setSnd(100);

            it('fst should return 10', () => expect(tuple2.fst).to.equal(10));
            it('snd should return 100', () => expect(tuple2.snd).to.equal(100));
        });
    });
});