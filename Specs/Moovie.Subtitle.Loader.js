/* global Moovie */
describe('Moovie.Subtitle.Loader', function () {
    'use strict';
    
    it('is a class', function () {
        expect(Moovie.Subtitle.Loader).toBeA('class');
    });
    
    it('extends the request object', function () {
        expect(new Moovie.Subtitle.Loader({})).toBeAnInstanceOf(Request);
    });
    
    describe('@constructor', function () {
        it('removes the "X-Requested-With" header, unless provided in options', function () {
            var options = {
                url: 'http://localhost/moovie/avatar.srt',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            
            expect(new Moovie.Subtitle.Loader(options).headers).toHaveKeys(['X-Requested-With']);
            
            delete options.headers;
            expect(new Moovie.Subtitle.Loader(options).headers).not.toHaveKeys(['X-Requested-With']);
        });
    });
});
