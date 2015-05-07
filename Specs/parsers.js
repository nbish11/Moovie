/* global Moovie */
describe('parsers that Moovie provides by default', function () {
    'use strict';
    
    describe('srt', function () {
        beforeEach(function () {
            this.parser = new Moovie.Subtitle.Parser('srt');
            this.rawData = "1\r00:00:09,115 --> 00:00:10,180\rAre you Jake Sully?\r\r";
            this.rawData += "2\n00:00:12,720 --> 00:00:15,220\nI'd like to talk to you about a fresh start, on a new world.\n\n";
            this.rawData += "3\r\n00:00:16,915 --> 00:00:18,280\r\nYou'd be making a difference.\r\n\r\n";
            this.rawData += "4\r00:00:23,100 --> 00:00:24,800\nI became a marine for the hardship.\r\n\n";
        });
        
        it('parse() parses correctly', function () {
            var cues = this.parser.parse(this.rawData);
            
            expect(cues).toBeA('array');
            expect(cues.length).toEqual(4);
            expect(cues[0]).toBeAnInstanceOf(window.SRTCue);
        });
        
        it('toSeconds() should parse milliseconds correctly', function () {
            expect(this.parser.toSeconds('00:00:00,001')).toEqual(0.001);
            expect(this.parser.toSeconds('00:00:00,021')).toEqual(0.021);
            expect(this.parser.toSeconds('00:00:00,321')).toEqual(0.321);
            expect(this.parser.toSeconds('00:00:00,320')).toEqual(0.32);
        });
        
        it('toSeconds() should parse seconds correctly', function () {
            expect(this.parser.toSeconds('00:00:09,001')).toEqual(9.001);
            expect(this.parser.toSeconds('00:00:19,000')).toEqual(19);
            expect(this.parser.toSeconds('00:00:09,115')).toEqual(9.115);
            expect(this.parser.toSeconds('00:00:10,180')).toEqual(10.18);
        });
        
        it('toSeconds() should parse minutes correctly', function () {
            expect(this.parser.toSeconds('00:01:05,800')).toEqual(65.8);
            expect(this.parser.toSeconds('00:43:19,000')).toEqual(2599);
            expect(this.parser.toSeconds('00:33:09,100')).toEqual(1989.1);
            expect(this.parser.toSeconds('00:04:10,080')).toEqual(250.08);
        });
        
        it('toSeconds() should parse hours correctly', function () {
            expect(this.parser.toSeconds('01:00:00,000')).toEqual(3600);
            expect(this.parser.toSeconds('01:37:08,050')).toEqual(5828.05);
            expect(this.parser.toSeconds('13:03:13,100')).toEqual(46993.1);
            expect(this.parser.toSeconds('11:11:00,008')).toEqual(40260.008);
        });
    });
});
