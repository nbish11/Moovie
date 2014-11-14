/*global Moovie */
"use strict";

describe('Moovie Test Suite', function () {
    
    it('expect Moovie() to be defined and a function', function () {
        expect(Moovie).toBeDefined();
        expect(typeof Moovie === 'function').toBe(true);
    });
    
});