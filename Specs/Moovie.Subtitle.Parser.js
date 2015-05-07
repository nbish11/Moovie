/* global Moovie */
describe('Moovie.Subtitle.Parser', function () {
    'use strict';
    
    it('is a class', function () {
        expect(Moovie.Subtitle.Parser).toBeA('class');
    });
    
    describe('@constructor', function () {
        it('accepts the correct arguments', function () {
            expect(function () {
                return new Moovie.Subtitle.Parser();
            }).toThrow();
            
            expect(function () {
                return new Moovie.Subtitle.Parser('srt');
            }).not.toThrow();
        });
        
        it('throws an error if the parser could not be found', function () {
            expect(function () {
                return new Moovie.Subtitle.Parser('nope');
            }).toThrowError('The parser "nope" could not be found');
        });
        
        it('returns the correct parser', function () {
            var srtParser = new Moovie.Subtitle.Parser('srt');
            
            expect(srtParser).toBeA('object');
        });
    });
    
    describe('supports()', function () {
        it('can be called statically', function () {
            expect(Moovie.Subtitle.Parser.supports).toBeDefined();
        });
        
        it('returns false if a parser has not been registered', function () {
            expect(Moovie.Subtitle.Parser.supports('nope')).toEqual(false);
        });
        
        it('returns true if a parser has been registered', function () {
            expect(Moovie.Subtitle.Parser.supports('srt')).toEqual(true);
        });
    });
    
    describe('register()', function () {
        it('can be called statically', function () {
            expect(Moovie.Subtitle.Parser.register).toBeDefined();
        });
        
        it('accepts the correct arguments', function () {
            expect(function () {
                Moovie.Subtitle.Parser.register();
            }).toThrow();
            
            expect(function () {
                Moovie.Subtitle.Parser.register('sub');
            }).toThrow();
        });
        
        it('throws an error if the object does not have a "parse()" method', function () {
            expect(function () {
                Moovie.Subtitle.Parser.register('nope', {});
            }).toThrowError('Abstract method "parse(raw)" was not implemented');
        });
        
        it('is now registered', function () {
            Moovie.Subtitle.Parser.register('nope', {
                parse: function (data) {
                    return data.clean();
                }
            });
            
            expect(Moovie.Subtitle.Parser.supports('nope')).toEqual(true);
        });
    });
});
