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
    
    it('adds an "SRTCue" interface to the window', function () {
        expect(window.SRTCue).toBeDefined();
    });
    
    it('adds a "VTTCue" interface to the window', function () {
        expect(window.VTTCue).toBeDefined();
    });
    
});
