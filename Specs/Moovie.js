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
    
    // tests for existing behaviour, as defined by Colin.
    describe('when used as a function', function () {
        
        var video1, video2, video3;
        
        beforeEach(function () {
            video1 = new Element('video#video-1').inject(document.body);
            video2 = new Element('video#video-2').inject(document.body);
            video3 = new Element('video#video-3').inject(document.body);
        });
        
        afterEach(function () {
            video1.destroy();
            video2.destroy();
            video3.destroy();
        });
        
        describe('and called with an array of elements', function () {
            it('should convert every element into a Moovie instance', function () {
                
                /* jshint newcap:false */
                Moovie([video1, video2, video3]);
                
                expect(video1.Moovie).toBeDefined();
                expect(video2.Moovie).toBeDefined();
                expect(video3.Moovie).toBeDefined();
                
                expect(video1.Moovie.video).toEqual(video1);
                expect(video2.Moovie.video).toEqual(video2);
                expect(video3.Moovie.video).toEqual(video3);
            });
        });
        
        describe('and called with an "Elements" object', function () {
            it('should convert every element into a Moovie instance', function () {
                var videos = $$('video');
                
                /* jshint newcap:false */
                Moovie(videos);
                
                expect(videos[0].Moovie).toBeDefined();
                expect(videos[1].Moovie).toBeDefined();
                expect(videos[2].Moovie).toBeDefined();
                
                expect(videos[0].Moovie.video).toEqual(video1);
                expect(videos[1].Moovie.video).toEqual(video2);
                expect(videos[2].Moovie.video).toEqual(video3);
            });
        });
        
        describe('and called with an array of objects', function () {
            it('should convert the "video" property into a Moovie instance', function () {
                var videos = [{
                    video: video1
                }, {
                    video: video2
                }, {
                    video: video3
                }];
                
                /* jshint newcap:false */
                Moovie(videos);
                
                expect(videos[0].video.Moovie).toBeDefined();
                expect(videos[1].video.Moovie).toBeDefined();
                expect(videos[2].video.Moovie).toBeDefined();
                
                expect(videos[0].video.Moovie.video).toEqual(video1);
                expect(videos[1].video.Moovie.video).toEqual(video2);
                expect(videos[2].video.Moovie.video).toEqual(video3);
            });
            
            it('can overide generic options with the values provided in the "options" property', function () {
                var options = {
                    autohideControls: false,
                    debug: true,
                    title: 'Avatar'
                };
                
                var videos = [{
                    video: video1,
                    options: {
                        debug: false
                    }
                }, {
                    video: video2,
                    options: {
                        title: 'Alice in Wonderland'
                    }
                }];
                
                /* jshint newcap:false */
                Moovie(videos, options);
                
                // video1 Moovie options
                expect(video1.Moovie.options.autohideControls).toEqual(false);
                expect(video1.Moovie.options.debug).toEqual(false);
                expect(video1.Moovie.options.title).toEqual('Avatar');
                
                // video2 Moovie options
                expect(video2.Moovie.options.autohideControls).toEqual(false);
                expect(video2.Moovie.options.debug).toEqual(true);
                expect(video2.Moovie.options.title).toEqual('Alice in Wonderland');
            });
        });
        
    });
    
});
