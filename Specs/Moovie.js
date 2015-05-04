/*global Moovie, screenfull */

describe('Moovie Test Suite', function () {
    'use strict';
    
    it('provides native fullscreen support', function () {
        var div = new Element('div');
        
        expect(div.requestFullscreen).toBeA('function');
        expect(document.exitFullscreen).toBeA('function');
    });
    
    it('provides the Moovie() function', function () {
        expect(Moovie).toBeDefined();
        expect(Moovie).toBeA('function');
    });
    
});
