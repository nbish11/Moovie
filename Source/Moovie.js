/*
---
description: An advanced HTML5 video player for MooTools.

version: 1.0.0

license: MIT-style

copyright: Copyright (c) 2010 Colin Aarts

authors:
    - Colin Aarts
    - Nathan Bishop

requires:
    - MooTools-core 1.5.1
    - MooTools-more 1.5.1

provides: [Element.moovie]
...
*/

/* global console, screenfull */
(function () {
    'use strict';
    
    if (typeOf(screenfull) === 'undefined') {
        throw new Error('the screenfull.js library could not be found');
    }
    
    var hasFullscreenSupport = 'requestFullscreen' in new Element('div');
    var hasTrackSupport = 'track' in new Element('track');
    
    Element.implement({
        requestFullscreen: function () {
            screenfull.request(this);
        }
    });
    
    document.fullscreenElement = screenfull.element;
    document.fullscreenEnabled = screenfull.enabled;
    
    document.exitFullscreen = document.exitFullscreen || function () {
        screenfull.exit();
    };
    
    Element.NativeEvents[screenfull.raw.fullscreenchange] = 2;
    document.addEvent(screenfull.raw.fullscreenchange, function (e) {
        document.fullscreenElement = screenfull.element;
        document.fullscreenEnabled = screenfull.enabled;
        
        this.fireEvent('fullscreenchange', e);
    });
    
    Element.NativeEvents[screenfull.raw.fullscreenerror] = 2;
    document.addEvent(screenfull.raw.fullscreenerror, function (e) {
        document.fullscreenElement = screenfull.element;
        document.fullscreenEnabled = screenfull.enabled;
        
        this.fireEvent('fullscreenerror', e);
    });
    
    // Add HTML 5 media events to Element.NativeEvents, if needed.
    if ( ! Element.NativeEvents.timeupdate) {
        Object.merge(Element.NativeEvents, {
            abort: 2, canplay: 2, canplaythrough: 2, durationchange: 2,
            emptied: 2, ended: 2, loadeddata: 2, loadedmetadata: 2,
            loadstart: 2, pause: 2, play: 2, playing: 2, progress: 2,
            ratechange: 2, seeked: 2, seeking: 2, stalled: 2, suspend: 2,
            timeupdate: 2, volumechange: 2, waiting: 2
        });
    }
    
    var SRTCue = window.SRTCue || function SRTCue(startTime, endTime, text) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.text = text;
    };
    
    window.SRTCue = SRTCue;
    
    var VTTCue = window.VTTCue || function VTTCue(startTime, endTime, text) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.text = text;
    };
    
    window.VTTCue = VTTCue;
    
    var disableNativeTextTracks = function (video) {
        video = document.id(video);
        
        if (hasTrackSupport) {
            for (var i = 0, l = video.textTracks.length; i < l; i++) {
                video.textTracks[i].mode = 'disabled';
            }
        }
    };
    
    var TextTrack = function TextTrack(element, video) {
        var activeCues = [];
        var cues = [];
        var id = '';
        var inBandMetadataTrackDispatchType = '';
        var language = '';
        var mode = 'disabled';
        var cueDisplay = new Element('div.cue-display', {
            styles: {
                position: 'absolute',
                left: '0',
                right: '0',
                top: '75%',
                /*top: 290px,*/
                width: '100%',
                'text-align': 'center'
            }
        });
        
        var displayAdded = false;
        
        var self = this;
        var getNewCueElement = function (activeCue) {
            return new Element('div.cue', {
                text: activeCue.text,
                styles: {
                    color: 'white',
                    font: 'bold 16px/37px Helvetica, Sans-Serif',
                    'letter-spacing': '.5px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    padding: '5px',
                    display: 'inline-block'
                }
            });
        };
        
        var displayCues = function () {
            cueDisplay.empty().setStyle('display', '');
        };
        
        var hideCues = function () {
            cueDisplay.setStyle('display', 'none').empty();
        };
        
        var setActiveCues = function (e) {
            var found = false;
            var delay = self.delay || 0.13;
            var time = e.target.currentTime;
            
            if (!displayAdded) {
                cueDisplay.inject(video, 'after');
                displayAdded = true;
            }
            
            cues.each(function (cue) {
                if (cue.startTime <= (time + delay) && cue.endTime >= time) {
                    found = true;
                    activeCues.push(cue);
                    
                    if (mode === 'showing') {
                        displayCues();
                        cueDisplay.grab(getNewCueElement(cue));
                    }
                }
            });
            
            if (!found || mode === 'hidden') {
                hideCues();
            }
        };
        
        Object.defineProperties(this, {
            activeCues: {
                enumerable: true,
                get: function () {
                    return activeCues;
                }
            },
            cues: {
                enumerable: true,
                get: function () {
                    return cues;
                }
            },
            id: {
                enumerable: true,
                get: function () {
                    return id;
                }
            },
            inBandMetadataTrackDispatchType: {
                enumerable: true,
                get: function () {
                    return inBandMetadataTrackDispatchType;
                }
            },
            kind: {
                enumerable: true,
                get: function () {
                    return element.kind;
                }
            },
            label: {
                enumerable: true,
                get: function () {
                    return element.label;
                }
            },
            language: {
                enumerable: true,
                get: function () {
                    return language;
                }
            },
            mode: {
                enumerable: true,
                get: function () {
                    return mode;
                },
                set: function (value) {
                    mode = value;
                    
                    if (mode === 'disabled') {
                        video.removeEvent('timeupdate', setActiveCues);
                        hideCues();
                    } else if (mode === 'showing' || mode === 'hidden') {
                        video.addEvent('timeupdate', setActiveCues);
                    }
                }
            }
        });
        
        this.addCue = function addCue(cue) {
            cues.push(cue);
        };
        
        this.removeCue = function addCue() {
            
        };
    };
    
    Element.implement({
        toHTMLTrackElement: function () {
            var element = this;
            var video = this.getParent('video');
            var readyState = 0;
            var track = new TextTrack(element, video);
            var loader = new Moovie.Subtitle.Loader({
                url: element.get('src'),
                onSuccess: function (response) {
                    var ext = this.options.url.split('.').pop();
                    var parser = new Moovie.Subtitle.Parser(ext);
                    
                    parser.parse(response).each(track.addCue);
                    
                    if (element.hasAttribute('default')) {
                        track.mode = 'showing';
                    }
                    
                    this.readyState = 2;
                }
            }).send();
            
            Object.defineProperties(element, {
                kind: {
                    enumerable: true,
                    get: function () {
                        return this.get('kind');
                    },
                    set: function (value) {
                        this.set('kind', value);
                    }
                },
                src: {
                    enumerable: true,
                    get: function () {
                        return this.get('src');
                    },
                    set: function (value) {
                        this.set('src', value);
                        
                        // resend request
                        loader = new Moovie.Subtitle.Loader({
                            url: value,
                            onSuccess: function (response) {
                                var ext = this.options.url.split('.').pop();
                                var parser = new Moovie.Subtitle.Parser(ext);
                                
                                parser.parse(response).each(track.addCue);
                                this.readyState = 2;
                            }
                        }).send();
                    }
                },
                srclang: {
                    enumerable: true,
                    get: function () {
                        return this.get('srclang');
                    },
                    set: function (value) {
                        this.set('srclang', value);
                    }
                },
                label: {
                    enumerable: true,
                    get: function () {
                        return this.get('label');
                    },
                    set: function (value) {
                        this.set('label', value);
                    }
                },
                'default': {
                    enumerable: true,
                    get: function () {
                        return this.hasAttribute('default');
                    },
                    set: function (value) {
                        if (value) {
                            this.set('default', '');
                        } else {
                            this.removeAttribute('default');
                        }
                    }
                },
                readyState: {
                    enumerable: true,
                    get: function () {
                        return loader.readyState;
                    }
                },
                track: {
                    enumerable: true,
                    get: function () {
                        return track;
                    }
                },
                NONE: {
                    enumerable: true,
                    writeable: false,
                    value: 0
                },
                LOADING: {
                    enumerable: true,
                    writeable: false,
                    value: 1
                },
                LOADED: {
                    enumerable: true,
                    writeable: false,
                    value: 2
                },
                ERROR: {
                    enumerable: true,
                    writeable: false,
                    value: 3
                }
            });
        }
    });
    
    var Moovie = function (videos, options) {
        
        // The main function, which handles one <video> at a time.
        // <http://www.urbandictionary.com/define.php?term=Doit&defid=3379319>
        var Doit = new Class({
            Implements: [Events, Options],
            
            options: {
                debug: false,
                autohideControls: true,
                title: null,
                playlist: [],
                captions: true,
                overlay: {
                    cover: true
                }
            },
            
            initialize: function (video, options) {
                this.video = document.id(video);    // Store reference to <video> tag.
                this.options.title = new URI(this.video.src).get('file');   // Provide a default title.
                this.setOptions(options);   // Set options.
                this.video.controls = false;    // Disable native player's native controls.
                
                // Browser support for textTracks is all over the place so, Moovie 
                // will disable native textTracks for it's own players. This gives 
                // us the added benefit of keeping SRT support as well. In addition,
                // Moovie will at least try to mimic the TextTrack API.
                disableNativeTextTracks(this.video);
                
                this.tracks = this.video.getChildren('track');
                if (this.tracks.length > 0) {
                    this.tracks.toHTMLTrackElement();
                }
                
                // Unfortunately, the media API only defines one volume-related event: 
                // `volumechange`. This event is fired whenever the media's `volume` 
                // attribute changes, or the media's `muted` attribute changes. The API 
                // defines no way to discern the two, so we'll have to "manually" keep 
                // track. We need to do this in order to be able to provide the advanced 
                // volume control (a la YouTube's player): changing the volume can have 
                // an effect on the muted state and vice versa.
                this._muted = this.video.muted;
                
                // add a stop function to the <video> tag
                if (!HTMLVideoElement.prototype.stop) {
                    HTMLVideoElement.prototype.stop = function () {
                        this.pause();
                        this.currentTime = 0;
                        return this;
                    };
                }
                
                // build Moovie
                this.build();
            },
            
            build: function () {
                // create some wrappers
                var player = new Element('div.player').wraps(this.video);
                var container = new Element('div.moovie').wraps(player);
                
                this._wrapper = this.player = player;        // player
                this._container = container;    // wraps player and debug
                
                // build debug
                this.debug = new Moovie.Debug(this.video);
                $(this.debug).inject(container);
                if (!this.options.debug) { this.debug.disable(); }
                
                // build player
                this.buildPlayer(player, container);
            },
            
            buildOverlay: function () {
                var self = this, cover = this.options.overlay.cover;
                
                var overlay         = new Element('div.overlay');
                overlay.wrapper     = new Element('div.wrapper');
                overlay.buffering   = new Element('div.buffering[text=Buffering...]');
                overlay.play        = new Element('div.play[text=Play Video]');
                overlay.replay      = new Element('div.replay[text=Replay]');
                overlay.paused      = new Element('div.paused[text=Paused]');
                
                overlay.wrapper.adopt(overlay.buffering, overlay.play, overlay.replay, overlay.paused);
                overlay.grab(overlay.wrapper);
                overlay.set('tween', { duration: 50 });
                overlay.fade('hide');
                
                overlay.update = function (which) {
                    if (which === 'none') {
                        if (cover) {
                            self.controls.setStyle('display', '');
                        }
                        
                        this.fade('out');
                    } else {
                        if (cover) {
                            this.setStyle('z-index', 9999);
                            self.controls.hide();
                            self.title.hide();
                            self.panels.update('none');
                        }
                        
                        this.wrapper.getChildren().hide();
                        this[which].show();
                        this.fade('in');
                    }
                };
                
                this.overlay = overlay;
                return this;
            },
            
            buildTitle: function () {
                this.title = new Element('div.title[text=' + this.options.title + ']');
                this.title.set('tween', { duration: 2000 });
                this.title.fade('out');
                
                this.title.setText = function (text) {
                    this.set('text', text);
                    return this;
                };
                
                var originalShow = this.title.show();
                this.title.show = function () {
                    this.fade('in');
                    
                    // fade out
                    var timer = setTimeout(function () {
                        this.fade('out');
                        timer = null;
                    }.bind(this), 6000);
                    
                    return this;
                };
                
                var originalHide = this.title.hide;
                this.title.hide = function () {
                    this.fade('out');
                    return this;
                };
                
                return this;
            },
            
            buildPlaylist: function () {
                var self = this, video = this.video;
                var playlist = new Element('div.playlist');
                
                var getExtension = function (f) {
                    return (/[.]/.exec(f)) ? /[^.]+$/.exec(f) : undefined;
                };
                
                // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/video.js
                var getSupport = function video() {
                    var elem = document.createElement('video');
                    var bool = false;
                    
                    try {
                        if (bool = !!elem.canPlayType) {
                            bool = Boolean(bool);
                            bool.ogg = elem.canPlayType('video/ogg; codecs="theora"').replace(/^no$/, '');
                            bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/, '');
                            bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/, '');
                            bool.vp9 = elem.canPlayType('video/webm; codecs="vp9"').replace(/^no$/, '');
                            bool.hls = elem.canPlayType('application/x-mpegURL; codecs="avc1.42E01E"').replace(/^no$/, '');
                            bool.mp4 = bool.h264;
                            bool.ogv = bool.ogg;
                        }
                    } catch (e) {}
                    
                    return bool;
                };
                
                playlist.index = 0;
                playlist.collection = [];
                playlist.length = 0;
                
                playlist.rewind = function () {
                    this.index = 0;
                    return this;
                };
                
                playlist.load = function () {
                    this.index = 1;
                    this.length = this.collection.length;
                    return this;
                };
                
                playlist.hasPrevious = function () {
                    return this.index > 1;
                };
                
                playlist.previous = function () {
                    return this.select(this.index - 1);
                };
                
                playlist.hasNext = function () {
                    return this.index < this.collection.length;
                };
                
                playlist.next = function () {
                    return this.select(this.index + 1);
                };
                
                playlist.select = function (id) {
                    if (typeOf(id) === 'string') {
                        this.collection.each(function (item, index) {
                            if (item.id === id) {
                                id = index + 1;
                                return; // break loop
                            }
                        });
                    }
                    
                    if (id > 0 && id <= this.collection.length) {
                        this.index = id;
                        var current = this.active();
                        
                        // set ".active" in HTML list
                        this.getElement('ol.playlist li.active').removeClass('active');
                        this.getElement('ol.playlist li[data-index="' + this.index + '"]').addClass('active');
                        
                        // set "src" attribute
                        if (current.src) {
                            video.src = current.src;
                        } else if (typeOf(current.sources) === 'array') {
                            var i = 0, s = getSupport(), l = current.sources.length;
                            
                            while (i < l) {
                                if (s[getExtension(current.sources[i])] === 'probably') {
                                    video.src = current.sources[i];
                                    break;
                                }
                                
                                i++;
                            }
                        }
                        
                        // set "poster" attribute
                        if (current.poster) {
                            video.poster = current.poster;
                        }
                        
                        // remove old <track> tags
                        video.getChildren('track').destroy();
                    
                        // add new <track> tags
                        if (current.tracks) {
                            current.tracks.each(function (track) {
                                if (typeOf(track) === 'object') {
                                    video.grab(new Element('track', {
                                        src: track.src,
                                        srclang: track.srclang || 'en',
                                        kind: 'moovie',
                                        label: track.label  // intentional return of "undefined"
                                    }));
                                }
                            });
                            
                            self.initTracks();
                        }
                        
                        video.load();
                        video.play();
                        
                        var title = current.title || new URI(current.src).get('file');
                        self.title.setText(title).show();
                        self.panels.update('none');
                        //panels.info.getElement('dt.title + dd').set('html', title);
                        //panels.info.getElement('dt.url + dd').set('html', current.src);
                    }
                    
                    return false;
                };
                
                playlist.active = function () {
                    return this.collection[this.index - 1];
                };
                
                playlist.each = function (callback) {
                    var active = this.index || 1;
                    
                    this.collection.forEach(function (item, index) {
                        callback.call(this, index + 1, item, active);
                    }, this);
                };
                
                // fetch the playlist
                (function () {
                    var firstItem = {
                        id: self.options.id,
                        src: video.currentSrc || video.src,
                        title: self.options.title,
                        poster: video.poster || self.options.poster,
                        tracks: video.getChildren('track')
                            .get('src', 'srclang', 'kind', 'label')
                    };
                    
                    // JSON playlist via AJAX
                    if (typeOf(self.options.playlist) === 'string') {
                        var data = null;
                        var request = new Request.JSON({
                            method: 'GET',
                            url: self.options.playlist,
                            async: false,
                            onSuccess: function (response) {
                                data = response;
                            }
                        }).send();
                        
                        data.unshift(firstItem);
                        playlist.collection.combine(data);
                    
                    // Embedded playlist
                    } else if (typeOf(self.options.playlist) === 'array') {
                        self.options.playlist.unshift(firstItem);
                        playlist.collection.combine(self.options.playlist);
                    }
                })();
                
                playlist.set('html', '\
                    <div><div class="heading">Playlist</div></div>\
                    <div><ol class="playlist"></ol></div>\
                ');
                
                playlist.each(function (index, item, active) {
                    var title = item.title || new URI(item.src).get('file');
                    this.getElement('ol.playlist').grab(new Element('li', {
                        'data-index': index,
                        'class': (index === active ? 'active' : ''),
                        'html': '\
                            <div class="checkbox-widget" data-checked="true">\
                                <div class="checkbox"></div>\
                                <div class="label">' + title + '</div>\
                            </div>\
                    '}));
                });
                
                this.playlist = playlist;
                return this;
            },
            
            buildPanels: function () {
                // States:
                var hasCaptions = !!this.tracks.getFirst('[kind=captions][default]') || this.options.captions;
                var loopVideo = !!this.video.loop || this.options.loop;
                
                
                var panels          = new Element('div.panels');
                panels.info         = new Element('div.info');
                panels.settings     = new Element('div.settings');
                panels.about        = new Element('div.about');
                panels.playlist     = this.playlist;
                
                panels.adopt(panels.info, panels.settings, panels.about, panels.playlist);
                panels.set('tween', {duration: 250});
                panels.fade('hide');
                
                panels.update = function (which) {
                    if (which === 'none' || this[which].hasClass('active')) {
                        this.getChildren('.active').removeClass('active');
                        this.fade('out');
                    } else {
                        this.getChildren().hide().removeClass('active');
                        this[which].show().addClass('active');
                        this.fade('in');
                    }
                };

                // Content for `info` panel
                panels.info.set('html', '\
                    <div class="heading">Video information</div>\
                    \
                    <dl>\
                        <dt class="title">Title</dt>\
                        <dd>' + this.options.title + '</dd>\
                        \
                        <dt class="url">URL</dt>\
                        <dd>' + this.video.src + '</dd>\
                        \
                        <dt class="size">Size</dt>\
                        <dd></dd>\
                    </dl>\
                ');
                
                // Content for `settings` panel
                panels.settings.set('html', '\
                    <div class="heading">Settings</div>\
                    \
                    <div class="checkbox-widget" data-control="autohideControls" data-checked="' + this.options.autohideControls + '">\
                        <div class="checkbox"></div>\
                        <div class="label">Auto-hide controls</div>\
                    </div>\
                    \
                    <div class="checkbox-widget" data-control="loop" data-checked="' + loopVideo + '">\
                        <div class="checkbox"></div>\
                        <div class="label">Loop video</div>\
                    </div>\
                    \
                    <div class="checkbox-widget" data-control="captions" data-checked="' + hasCaptions + '">\
                        <div class="checkbox"></div>\
                        <div class="label">Show captions</div>\
                    </div>\
                    \
                    <div class="checkbox-widget" data-control="debug" data-checked="' + this.options.debug + '">\
                        <div class="checkbox"></div>\
                        <div class="label">Enable/Disable Debug Panel</div>\
                    </div>\
                ');

                // Content for `about` panel
                panels.about.set('html', '\
                    <div class="heading">About this player</div>\
                    \
                    <p><b>Moovie</b> v1.0 <i>alpha</i></p>\
                    <p>Copyright © 2010, Colin Aarts</p>\
                    <p><a href="http://colinaarts.com/code/moovie/" rel="external">http://colinaarts.com/code/moovie/</a></p>\
                ');
                
                this.panels = panels;
                return this;
            },
            
            buildControls: function () {
                var video = this.video;
                
                // formats seconds into HH:MM:SS
                var toTimeString = function (val) {
                    var hh = (val / 3600).toInt();
                    var mm = ((val - (hh * 3600)) / 60).toInt();
                    var ss = (val - (hh * 3600) - (mm * 60)).toInt();
                    var time = '';

                    if (hh !== 0) {
                        time = hh + ':';
                    }
                    
                    if (mm !== 0 || time !== '') {
                        time += (mm < 10 && time !== '' ? '0': '') + mm + ':';
                    }
                    
                    if (time === '') {
                        time += '0:' + (ss < 10 ? '0' : '') + ss;
                    } else {
                        time += (ss < 10 ? '0' : '') + ss;
                    }
                    
                    return time;
                };
                
                var controls            = new Element('div.controls');
                controls.wrapper        = new Element('div.wrapper');

                // General
                controls.play           = new Element('div.play');  // @todo: implement "title"...
                controls.stop           = new Element('div.stop[title=Stop]');
                controls.currentTime    = new Element('div.elapsed[text=0:00]');
                controls.duration       = new Element('div.duration[text=0:00]');
                controls.settings       = new Element('div.settings[title=Settings]');
                controls.fullscreen     = new Element('div.fullscreen[title=Fullscreen]');   // @todo: change title to reflect state
                controls.previous       = this.playlist.length > 1 ? new Element('div.previous[title=Previous]') : null;
                controls.next           = this.playlist.length > 1 ? new Element('div.next[title=Next]') : null;
                
                // Progress
                controls.progress           = new Element('div.progress');
                controls.progress.wrapper   = new Element('div.wrapper');
                controls.progress.bar       = new Element('div.bar');
                controls.progress.time      = new Element('div.time').grab(new Element('div[text=0:00]'));
                controls.progress.buffered  = new Element('div.buffered');
                controls.progress.played    = new Element('div.played');
                controls.progress.knob      = new Element('div.knob');
                
                controls.progress.wrapper.adopt(controls.progress.bar, controls.progress.buffered, controls.progress.played, controls.progress.knob, controls.progress.time);
                controls.progress.grab(controls.progress.wrapper);
                controls.progress.time.fade('hide');

                // Volume
                controls.volume         = new Element('div.volume');
                controls.volume.mute    = new Element('div.mute');
                controls.volume.wrapper = new Element('div.wrapper');
                controls.volume.popup   = new Element('div.popup');
                controls.volume.bar     = new Element('div.bar');
                controls.volume.knob    = new Element('div.knob');
                
                controls.volume.popup.adopt(controls.volume.bar.grab(controls.volume.knob));
                controls.volume.wrapper.adopt(controls.volume.mute, controls.volume.popup);
                controls.volume.grab(controls.volume.wrapper);
                controls.volume.popup.fade('hide');
                controls.volume.popup.set('tween', { duration: 150 });

                // "more"
                controls.more           = new Element('div.more');
                controls.more.wrapper   = new Element('div.wrapper');
                controls.more.popup     = new Element('div.popup');
                controls.more.about     = new Element('div.about[title=About]');
                controls.more.info      = new Element('div.info[title=Info]');
                controls.more.playlist  = new Element('div.playlist[title=Playlist]');
                
                controls.more.popup.adopt(controls.more.about, controls.more.info, controls.more.playlist);
                controls.more.wrapper.grab(controls.more.popup);
                controls.more.grab(controls.more.wrapper);
                controls.more.popup.fade('hide');
                controls.more.popup.set('tween', { duration: 150 });
                
                controls.wrapper.adopt(
                    controls.play, controls.stop, controls.previous, controls.next, controls.currentTime, controls.progress,
                    controls.duration, controls.volume, controls.settings, controls.more, controls.fullscreen
                );
                
                controls.grab(controls.wrapper);
                controls.set('tween', { duration: 150 });
                
                controls.play.update = function () {
                    if (video.paused || video.ended) {
                        this.removeClass('paused');
                    } else {
                        this.addClass('paused');
                    }
                };
                
                controls.currentTime.update = function (val) {
                    this.set('text', toTimeString(val));
                };
                
                controls.duration.update = function (val) {
                    this.set('text', toTimeString(val));
                };
                
                controls.progress.time.setTime = function (val, offset) {
                    this.getFirst().set('text', toTimeString(val));
                    this.setStyle('left', offset + 'px');
                    this.fade('show');
                };
                
                this.controls = controls;
                return this;
            },
            
            buildPlayer: function (wrapper) {
                // references - so I don't have to bind
                var video = this.video,
                    muted = this._muted,
                    self = this;
                
                //build overlay
                this.buildOverlay();
                
                // build title and hide
                this.buildTitle();
                
                // build playlist
                this.buildPlaylist().playlist.load();
                
                // build panels
                this.buildPanels();
                
                // build controls
                this.buildControls();
                
                // Inject and do some post-processing --------------------------------------
                wrapper.adopt(this.overlay, this.title, this.panels, this.controls);
                
                // set video duration
                this.controls.duration.update(video.duration);
                
                this.controls.progress.slider = new Slider(this.controls.progress.bar,
                    this.controls.progress.knob, {
                        snap: 0,
                        mode: 'horizontal',
                        steps: 100,
                        initialStep: 0,
                        offset: -this.controls.progress.knob.getStyle('left').toInt(),
                        onChange: function (step) {
                            video.currentTime = (video.duration * step / this.steps).floor();
                            if (video.paused) { video.play(); }
                        }
                    }
                );
                
                this.controls.volume.slider = new Slider(this.controls.volume.bar,
                    this.controls.volume.knob, {
                        snap: 0,
                        mode: 'vertical',
                        steps: 100,
                        initialStep: (1 - video.volume) * 100,
                        offset: -this.controls.progress.knob.getStyle('left').toInt(),
                        onChange: function (step) {
                            video.volume = 1 - step /  this.steps;
                        }
                    }
                );
                
                this.bound = {
                    document: {
                        fullscreenchange: function () {
                            if (document.fullscreenElement) {
                                this.controls.fullscreen.addClass('fullscreened');
                            } else {
                                this.controls.fullscreen.removeClass('fullscreened');
                            }
                        }.bind(this)
                    },
                    
                    player: {
                        mouseenter: function () {
                            this.controls.fade('in');
                        }.bind(this),
                        
                        mouseleave: function () {
                            if (this.options.autohideControls) {
                                this.controls.fade('out');
                            }
                        }.bind(this)
                    },
                    
                    overlay: {
                        firstTimePlay: function () {
                            this.video.play();
                            this.title.show();
                        }.bind(this),
                        
                        playVideo: this.video.play.bind(this.video)
                    },
                    
                    panels: {
                        settings: function (e) {
                            var parent = e.target.getParent();
                            var checked = (parent.get('data-checked') === 'false' ? 'true' : 'false');
                            var control = parent.get('data-control');
                            
                            parent.set('data-checked', checked);
                            switch (control) {
                                case 'autohideControls':
                                    this.options.autohideControls = (checked === 'true');
                                    break;
                                    
                                case 'loop':
                                    this.video.loop = (checked === 'true');
                                    break;
                                    
                                case 'captions':
                                    var track = this.video.getFirst('track[kind=captions][default]').track;
                                    track.mode = checked === 'true' ? 'showing' : 'hidden';
                                    break;
                                    
                                case 'debug':
                                    this.debug[(checked === 'true' ? 'enable' : 'disable')]();
                                    break;
                            }
                            
                            this.panels.update('none');
                        }.bind(this)
                    },
                    
                    playlist: {
                        select: function (e) {
                            this.playlist.select(e.target.getParents('li')[0].get('data-index'));
                        }.bind(this)
                    },
                    
                    controls: {
                        play: this.togglePlayback.bind(this),
                        stop: this.video.stop.bind(this.video),
                        previous: this.playlist.previous.bind(this.playlist),
                        next: this.playlist.next.bind(this.playlist),
                        
                        seekbar: {
                            track: {
                                mousemove: function (e) {
                                    if ( ! e.target.hasClass('knob')) {
                                        var offsetPx = e.page.x - this.getPosition().x;
                                        var offsetPc = offsetPx / this.bar.getSize().x * 100;
                                        
                                        this.time.setTime(video.duration / 100 * offsetPc, offsetPx);
                                    }
                                },
                                
                                mouseleave: function () { this.time.fade('hide'); }
                            },
                            
                            knob: {
                                mouseenter: function () {
                                    var parent = this.getParent('.progress');
                                    var knobX = -parent.slider.options.offset;
                                    var barX = parent.bar.getPosition().x;
                                    var offset = this.getPosition().x - barX - knobX;
                                    
                                    parent.time.setTime(video.currentTime, offset);
                                },
                                
                                mouseleave: function () {
                                    this.getParent('.progress').time.fade('hide');
                                }
                            },
                            
                            played: function (e) {
                                this.controls.progress.slider.clickedElement(e);
                            }.bind(this)
                        },
                        
                        mute: function () { this.video.muted = !this.video.muted; }.bind(this),
                        
                        volume: {
                            mouseenter: function () { this.popup.fade('in'); },
                            mouseleave: function () { this.popup.fade('out'); }
                        },
                        
                        settings: function (e) {
                            if (e.target.hasClass('settings')) {
                                this.panels.update('settings');
                            }
                        }.bind(this),
                        
                        more: {
                            click: function (e) {
                                if (e.target.hasClass('playlist')) {
                                    this.panels.update('playlist');
                                } else if (e.target.hasClass('about')) {
                                    this.panels.update('about');
                                } else if (e.target.hasClass('info')) {
                                    this.panels.update('info');
                                }
                            }.bind(this),
                            
                            mouseenter: function () { this.popup.fade('in'); },
                            mouseleave: function () { this.popup.fade('out'); }
                        },
                        
                        fullscreen: this.toggleFullscreen.bind(this)
                    },
                    
                    // @todo: loadstart, durationchange, loadedmetadata, loadeddata, progress, canplay, canplaythrough
                    video: {
                        click: function () {
                            this.video.pause();
                            this.overlay.update('paused');
                        }.bind(this),
                        
                        play: function () {
                            this.controls.play.update();
                            this.overlay.update('none');
                        }.bind(this),
                        
                        pause: function () {
                            this.controls.play.update();
                            this.overlay.update('paused');
                        }.bind(this),
                        
                        ended: function () {
                            if (this.playlist.hasNext()) {
                                this.playlist.next();
                            } else {
                                this.controls.play.update();
                                this.overlay.update('replay');
                            }
                        }.bind(this),
                        
                        seeking: function () { this.overlay.update('buffering'); }.bind(this),
                        
                        seeked: function () {
                            this.overlay.update('none');
                            
                            if ( ! this.video.paused) {
                                this.controls.play.update();
                            }
                        }.bind(this),
                        
                        timeupdate: function () {
                            var duration = this.video.duration;
                            var currentTime = this.video.currentTime;
                            var slider = this.controls.progress.slider;
                            
                            this.controls.currentTime.update(currentTime);
                            
                            // update seekbar ".knob" knob
                            if ( ! slider.isDragging) {
                                var position = currentTime / duration * slider.range;
                                position = slider.toPosition(position);
                                slider.knob.setStyle(slider.property, position);
                            }
                            
                            // update seekbar ".played" bar
                            var pct = (currentTime / duration) * 100;
                            this.controls.progress.played.setStyle('width', pct + '%');
                        }.bind(this),
                        
                        durationchange: function () {
                            this.controls.duration.update(this.video.duration);
                        }.bind(this),
                        
                        volumechange: function () {
                            var mutedChanged = muted !== this.video.muted ? true : false;
                            muted = this.video.muted;

                            if (mutedChanged && !this.video.muted && this.video.volume === 0) {
                                // Un-muted with volume at 0 -- pick a sane default. This is probably the only deviation from the way the YouTube flash player handles volume control.
                                this.video.volume = 0.5;
                            } else if (this.video.muted && this.video.volume !== 0 && !mutedChanged) {
                                // IF volume changed while muted, THEN un-mute
                                this.video.muted = false;
                            } else if (!mutedChanged && !this.video.muted && this.video.volume === 0) {
                                // IF slider dragged to 0, THEN mute
                                this.video.muted = true;
                            }

                            if (this.video.muted) {
                                this.controls.volume.mute.addClass('muted');
                            } else {
                                this.controls.volume.mute.removeClass('muted');
                            }
                            
                            if ( ! this.controls.volume.slider.isDragging) {
                                var knob = this.controls.volume.knob;
                                // If muted, assume 0 for volume to visualize the muted state in the slider as well. Don't actually change the volume, though, so when un-muted, the slider simply goes back to its former value.
                                var volume = this.video.muted && mutedChanged ? 0 : this.video.volume;
                                var barSize = this.controls.volume.bar.getSize().y;
                                var offset = barSize - volume * barSize;
                                knob.setStyle('top', offset + -this.controls.volume.slider.options.offset);
                            }
                        }.bind(this)
                    },
                    
                    // Track video progress ourselves. This is still affected 
                    // by the attach() and detach() methods.
                    videoProgress: function () {
                        var b = this.video.buffered, l = b.length;
                        
                        while (l--) {
                            var buffer = (b.end(l) - b.start(l)).toInt();
                            var pct = (buffer * 100) / this.video.duration.toInt();
                            this.controls.progress.buffered.setStyle('width', pct + '%');
                        }
                        
                        this.bound.videoProgress.id = setTimeout(this.bound.videoProgress, 29);
                    }.bind(this)
                };
                
                this.attach();
                
                if ( ! video.autoplay) {
                    this.overlay.update('play');
                }

                var tips = new Tips(wrapper.getElements('[title]'), {
                    className: 'video-tip',
                    title: '',
                    text: function (el) {
                        return el.get('title');
                    }
                });
            },
            
            /**
             * Adds the event listeners used by Moovie.
             * 
             * @this {Doit}
             * @return {Doit} The instance on which this method was called.
             */
            attach: function () {
                var bound = this.bound;
                
                document.addEvents(bound.document);
                this.player.addEvents(bound.player);
                this.overlay.play.addEvent('click', bound.overlay.firstTimePlay);
                this.overlay.replay.addEvent('click', bound.overlay.firstTimePlay);
                this.overlay.paused.addEvent('click', bound.overlay.playVideo);
                this.panels.settings.addEvent('click:relay(.checkbox-widget)', bound.panels.settings);
                this.playlist.addEvent('click:relay(.label)', bound.playlist.select);
                this.controls.play.addEvent('click', bound.controls.play);
                this.controls.stop.addEvent('click', bound.controls.stop);
                
                if (this.playlist.length > 1) {
                   this.controls.previous.addEvent('click', bound.controls.previous);
                   this.controls.next.addEvent('click', bound.controls.next);
                }
                
                this.controls.progress.slider.attach();
                this.controls.progress.addEvents(bound.controls.seekbar.track);
                this.controls.progress.knob.addEvents(bound.controls.seekbar.knob);
                this.controls.progress.played.addEvent('click', bound.controls.seekbar.played);
                this.controls.volume.slider.attach();
                this.controls.volume.mute.addEvent('click', bound.controls.mute);
                this.controls.volume.addEvents(bound.controls.volume);
                this.controls.settings.addEvent('click', bound.controls.settings);
                this.controls.more.addEvents(bound.controls.more);
                this.controls.fullscreen.addEvent('click', bound.controls.fullscreen);
                this.video.addEvents(bound.video);
                this.debug.attach();
                bound.videoProgress();  // Start polling the "buffered" attribute.
                
                return this;
            },
            
            /**
             * Removes the event listeners used by Moovie.
             * 
             * @this {Doit}
             * @return {Doit} The instance on which this method was called.
             */
            detach: function () {
                var bound = this.bound;
                
                document.removeEvents(bound.document);
                this.player.removeEvents(bound.player);
                this.overlay.play.removeEvent('click', bound.overlay.firstTimePlay);
                this.overlay.replay.removeEvent('click', bound.overlay.firstTimePlay);
                this.overlay.paused.removeEvent('click', bound.overlay.playVideo);
                this.panels.settings.removeEvent('click:relay(.checkbox-widget)', bound.panels.settings);
                this.playlist.removeEvent('click:relay(.label)', bound.playlist.select);
                this.controls.play.removeEvent('click', bound.controls.play);
                this.controls.stop.removeEvent('click', bound.controls.stop);
                
                if (this.playlist.length > 1) {
                   this.controls.previous.removeEvent('click', bound.controls.previous);
                   this.controls.next.removeEvent('click', bound.controls.next);
                }
                
                this.controls.progress.slider.detach();
                this.controls.progress.removeEvents(bound.controls.seekbar.track);
                this.controls.progress.knob.removeEvents(bound.controls.seekbar.knob);
                this.controls.progress.played.removeEvent('click', bound.controls.seekbar.played);
                this.controls.volume.slider.detach();
                this.controls.volume.mute.removeEvent('click', bound.controls.mute);
                this.controls.volume.removeEvents(bound.controls.volume);
                this.controls.settings.removeEvent('click', bound.controls.settings);
                this.controls.more.removeEvents(bound.controls.more);
                this.controls.fullscreen.removeEvent('click', bound.controls.fullscreen);
                this.video.removeEvents(bound.video);
                this.debug.detach();
                clearTimeout(bound.videoProgress.id);   // Disable polling of the "buffered" attribute.
                
                return this;
            },
            
            /**
             * Play video if paused or ended, else pause video.
             * 
             * @this {Doit}
             * @return {Doit} The instance on which this method was called.
             */
            togglePlayback: function () {
                var v = this.video;
                
                if (v.paused && v.readyState >= 3) {
                    v.play();
                } else if (!v.paused && v.ended) {
                    v.currentTime = 0;
                } else if (!v.paused){
                    v.pause();
                }
                
                return this;
            },
            
            /**
             * Sends the player into fullscreen mode or out of
             * fullscreen mode.
             * 
             * @this {Doit}
             * @return {Doit} The instance on which this method was called.
             */
            toggleFullscreen: function () {
                if (document.fullscreenEnabled) {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        this.player.requestFullscreen();
                    }
                }
                
                return this;
            },
            
            /**
             * Returns the element used to wrap ".player" and ".debug".
             * 
             * @this {Doit}
             * @return {Doit} The instance on which this method was called.
             */
            toElement: function () {
                return this.element;
            }
        });

        // Init ======================================================================
        options = options || {};
        
        videos.each(function (el) {
            if (typeOf(el) === 'element') {
                el.Moovie = new Doit(el, options);
            } else if (typeOf(el) === 'object') {
                el.options = el.options || {};
                el.options.id = el.id || null;
                
                // options need to be cloned as merging modifies 
                // the original object (I really, really hate this behaviour).
                el.video.Moovie = new Doit(el.video, Object.merge(Object.clone(options), el.options));
            }
        });
    };
    
    Moovie.Debug = new Class({
        properties: [
            'autoplay',
            'controls',
            'poster',
            'videoWidth',
            'videoHeight',
            'MediaError',
            'currentSrc',
            'networkState',
            'readyState',
            'seeking',
            'currentTime',
            'duration',
            'paused',
            'ended',
            'volume',
            'muted'
        ],
        
        initialize: function (video) {
            this.video = document.id(video);
            this.bound = {
                loadstart: this.loadstart.bind(this),
                progress: this.progress.bind(this),
                suspend: this.suspend.bind(this),
                abort: this.abort.bind(this),
                error: this.error.bind(this),
                emptied: this.emptied.bind(this),
                play: this.play.bind(this),
                pause: this.pause.bind(this),
                loadedmetadata: this.loadedmetadata.bind(this),
                loadeddata: this.loadeddata.bind(this),
                waiting: this.waiting.bind(this),
                canplay: this.canplay.bind(this),
                canplaythrough: this.canplaythrough.bind(this),
                seeking: this.seeking.bind(this),
                seeked: this.seeked.bind(this),
                timeupdate: this.timeupdate.bind(this),
                ended: this.ended.bind(this),
                durationchange: this.durationchange.bind(this),
                volumechange: this.volumechange.bind(this)
            };
            
            this.build();
        },
        
        build: function () {
            this.elements = {
                debug: new Element('div.debug'),
                table: new Element('table'),
                tbody: new Element('tbody'),
                tfoot: new Element('td[colspan=2][text=Instance ready...]')
            };
            
            this.properties.forEach(function (el) {
                var row = new Element('tr'),
                    cell = new Element('td[text=' + el + ']');
                this.elements[el] = new Element('td[text=' + this.video[el] + ']');
                row.adopt(cell, this.elements[el]);
                this.elements.tbody.grab(row);
            }.bind(this));
            
            this.elements.table.grab(
                this.elements.tbody
            );
            
            this.elements.debug.adopt(
                this.elements.tbody,
                new Element('tfoot').grab(new Element('tr').grab(this.elements.tfoot))
            );
        },
        
        attach: function () {
            this.video.addEvents(this.bound);
        },
        
        detach: function () {
            this.video.removeEvents(this.bound);
        },
        
        enable: function () {
            this.attach();
            this.elements.debug.show();
        },
        
        disable: function () {
            this.detach();
            this.elements.debug.hide();
        },
        
        flash: function (key, val, msg) {
            this.elements[key].set('text', val);
            this.elements[key].getParent().highlight();
            if (msg) {
                this.elements.tfoot.set('text', msg);
                this.elements.tfoot.highlight();
            }
        },
        
        loadstart: function () {
            this.flash('networkState', this.video.networkState,
                'The video has begun it\'s resource selection algorithm.');
        },
        
        progress: function () {
            this.flash('networkState', this.video.networkState,
                'Currently fetching media data...');
        },
        
        suspend: function () {
            this.flash('networkState', this.video.networkState,
                'Fetching media data has intentionally been suspended.');
        },
        
        abort: function () {
            this.flash('networkState', this.video.networkState,
                'The fetching of media data has been stopped (not an error).');
        },
        
        error: function () {
            this.flash('networkState', this.video.networkState);
            this.flash('MediaError', this.video.MediaError,
                'An error has occurred while fetching media data.');
        },
        
        emptied: function () {
            this.flash('networkState', this.video.networkState,
                'The video\'s network state has gone from previously full to empty.');
        },
        
        play: function () {
            this.flash('paused', this.video.paused);
            this.flash('ended', this.video.ended);
        },
        
        pause: function () {
            this.flash('paused', this.video.paused);
        },
        
        loadedmetadata: function () {
            this.flash('readyState', this.video.readyState,
                'Video dimensions, duration and text tracks are ready.');
        },
        
        loadeddata: function () {
            this.flash('readyState', this.video.readyState,
                'Some data is available, but more is needed.');
        },
        
        waiting: function () {
            this.flash('readyState', this.video.readyState,
                'Waiting for the next frame to become available.');
        },
        
        canplay: function () {
            this.flash('readyState', this.video.readyState,
                'Video can play, but will likely encounter buffering issues.');
        },
        
        canplaythrough: function () {
            this.flash('readyState', this.video.readyState,
                'Video is likely to play from start to finish, without buffering.');
        },
        
        seeking: function () {
            this.flash('seeking', this.video.seeking);
        },
        
        seeked: function () {
            this.flash('seeking', this.video.seeking);
        },
        
        timeupdate: function () {
            this.flash('currentTime', this.video.currentTime.round(3));
        },
        
        ended: function () {
            this.flash('ended', this.video.ended);
        },
        
        durationchange: function () {
            this.flash('duration', this.video.duration.round(3));
        },
        
        volumechange: function () {
            this.flash('muted', this.video.muted);
            this.flash('volume', this.video.volume.round(3));
        },
        
        toElement: function () {
            return this.elements.debug;
        }
    });
    
    /** @module Subtitle */
    Moovie.Subtitle = {};
    
    Moovie.Subtitle.Loader = new Class({
        Extends: Request,
        
        options: {
            method: 'GET',
            async: true,
            onProgress: function () {
                this.readyState = 1;
            },
            onSuccess: function () {
                this.readyState = 2;
            },
            onFailure: function () {
                this.readyState = 3;
            },
            onError: function () {
                this.readyState = 3;
            }
        },
        
        /**
         * Essentially a glorified wrapper for the Request 
         * class. It fixes a Request bug, defaults some options 
         * and adds a readyState property.
         * 
         * @constructor
         * @param {String} The URL to the subtitle file.
         * @param {Object} Any additional options needed.
         * @return {this}
         */
        initialize: function (options) {
            this.parent(options);
            this.readyState = 0;
            
            if (!('headers' in options && 'X-Requested-With' in options.headers)) {
                delete this.headers['X-Requested-With'];
            }
        }
    });
    
    /**
     * Creates and return new instances of 
     * registered parsers.
     * 
     * @constructor
     * @param {String} The name of the parser
     * @param {Object} An optional options object to be passed
     * @return {Class} The parser instance.
     */
    Moovie.Subtitle.Parser = (function () {
        var parsers = {};
        
        // private constructor: returns new instances of registered parsers
        var Parser = new Class(function (type, options) {
            if (!Parser.supports(type)) {
                throw new Error('The parser "' + type + '" could not be found');
            }
            
            return new parsers[type](options || {});
        });
        
        /**
         * Registers a new parser with the class.
         * 
         * @static
         * @param {String}
         * @param {Object}
         * @return {void}
         */
        Parser.register = function (parserType, parserClass) {
            if (!('parse' in parserClass)) {
                throw new Error('Abstract method "parse(raw)" was not implemented');
            }
            
            parsers[parserType] = new Class(parserClass);
        };
        
        /**
         * Check if a specific parser has been registered.
         * 
         * @static
         * @param {String}
         * @return {Boolean}
         */
        Parser.supports = function (parserType) {
            return parserType in parsers;
        };
        
        return Parser;
    })();
    
    // Register default parsers
    Moovie.Subtitle.Parser.register('srt', {
        /**
         * Parses a raw string and returns an array of 
         * objects representing "cues".
         * 
         * @param {String}
         * @return {Array}
         */
        parse: function (raw) {
            raw = raw.replace(/\r\n|\r/gm, '\n').trim().split('\n\n');
            
            return raw.map(function (cue) {
                cue = cue.split('\n');
                
                var cueid = cue.shift();
                var cuetc = cue.shift().split(' --> ');
                var cuetx = cue.join('\n');
                
                return new SRTCue(
                    this.toSeconds(cuetc[0]),
                    this.toSeconds(cuetc[1]),
                    cuetx
                );
            }, this);
        },
        
        /**
         * Formats an SRT timestamp to seconds. E.g. "00:42:11,013"
         * 
         * @param {String}
         * @return {Float}
         */
        toSeconds: function (srtTimeStamp) {
            var parts = srtTimeStamp.split(/[:,]/);
            
            return parts[0].toInt() * 3600 +
                parts[1].toInt() * 60 +
                parts[2].toInt() +
                parts[3].toInt() / 1000;
        }
    });
    
    // In the future this will be a fully fledged WebVTT parser, 
    // but for now, this is only here to maintain compatibility 
    // with my previous commits.
    Moovie.Subtitle.Parser.register('vtt', {
        parse: function (raw) {
            var cues = new Moovie.Subtitle.Parser('srt').parse(raw);
            return cues.map(function (cue) {
                return new VTTCue(cue.startTime, cue.endTime, cue.text);
            });
        }
    });
    
    window.Moovie = Moovie;
})();
