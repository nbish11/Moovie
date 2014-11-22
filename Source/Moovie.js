/*
---
description: An advanced HTML5 video player for MooTools.

version: 0.7.2

license: MIT-style

copyright: Copyright (c) 2010 Colin Aarts

authors:
    - Colin Aarts
    - Nathan Bishop

requires:
    - MooTools-core 1.5.1
    - MooTools-more 1.5.1
    - [Class.Mutators.TrackInstances]

provides: [Element.moovie]

...
*/
"use strict";

var Moovie = function (videos, options) {
    var Debug = new Class({
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
            this.attach();
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
            // add to DOM
            this.attach();
        },
        
        disable: function () {
            this.detach();
            // remove from DOM
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
    
    // The main function, which handles one <video> at a time.
    // <http://www.urbandictionary.com/define.php?term=Doit&defid=3379319>
    var Doit = new Class({
        Implements: [Events, Options],
        
        options: {
            debug: false,
            autohideControls: true,
            title: null,
            playlist: [],
            captions: true
        },
        
        initialize: function (video, options) {
            // reference to <video> tag
            this.video = document.id(video);
            
            // set default title in options
            this.options.title = new URI(this.video.src).get('file');
            
            // overide defaults with user provided options
            this.setOptions(options);
            
            // turn off HTML5 native video controls
            this.video.controls = false;
            
            // load tracks
            this.initTracks();
            
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
        
        TrackInstances: true,
        
        initTracks: function () {
            var parse = function (data) {
                var cues = [];
                var toSeconds = function (t) {
                    t = t.split(/[:,]/);
                    
                    return t[0].toInt() * 3600 +
                           t[1].toInt() * 60 +
                           t[2].toInt() +
                           t[3].toInt() / 1000;
                };
                
                // Two newlines ("\n\n") in a row is considered the cue break.
                data = data.replace(/\r?\n/gm, '\n').split('\n\n');
                
                data.each(function (cue) {
                    cue = cue.split('\n');
                    
                    var id = cue.shift(),
                        time = cue.shift().split(/[\t ]*-->[\t ]*/),
                        
                        // for if the text contains multiple lines
                        text = cue.join('<br>');
                        
                    cues.push({
                        id: id,
                        start: toSeconds(time[0]),
                        end: toSeconds(time[1]),
                        text: text
                    });
                });
                
                return cues;
            };
            
            this.video.getChildren('track').each(function (track) {
                if (track.get('src') && track.get('kind') === 'moovie') {
                    var request = new Request({
                        method: 'GET',
                        url: track.get('src'),
                        async: false,
                        onSuccess: function (response) {
                            track.cues = parse(response);
                        }
                    }).send();
                }
            });
        },
        
        build: function () {
            // create some wrappers
            var wrapper = new Element('div.player').wraps(this.video),
                container = new Element('div.moovie').wraps(wrapper);
                
            this._wrapper = this.player = wrapper;        // player
            this._container = container;    // wraps player and debug
            
            // build debug
            if (this.options.debug) {
                this.debug = new Debug(this.video);
                $(this.debug).inject(container);
            }
            
            // build player
            this.buildPlayer(wrapper, container);
        },
        
        buildCaptions: function () {
            this.captions = new Element('div.captions');
            this.captions.caption = new Element('p');
            this.captions.grab(this.captions.caption);
            this.captions.hide();
        },
        
        buildOverlay: function () {
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
                    this.fade('out');
                } else {
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
                    video.src = current.src;
                    
                    // set "poster" attribute
                    if (current.poster) {
                        video.poster = current.poster;
                    }
                    
                    // remove old <track> tags
                    video.getChildren('track').destroy();
                
                    // add new <track> tags
                    if (current.tracks) {
                        current.tracks.each(function (track, index) {
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
                <div class="checkbox-widget" data-control="loop" data-checked="' + (this.video.loop || false) + '">\
                    <div class="checkbox"></div>\
                    <div class="label">Loop video</div>\
                </div>\
                \
                <div class="checkbox-widget" data-control="captions" data-checked="' + this.options.captions + '">\
                    <div class="checkbox"></div>\
                    <div class="label">Show captions</div>\
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
            var video = this.video, self = this;
            
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
            
            controls.play.update = function (action) {
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
        
        buildPlayer: function (wrapper, container) {
            // references - so I don't have to bind
            var video = this.video,
                options = this.options,
                muted = this._muted,
                self = this;
            
            // build captions
            this.buildCaptions();
            
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
            wrapper.adopt(this.captions, this.overlay, this.title, this.panels, this.controls);

            // Adjust height of panel container to account for controls bar
            this.panels.setStyle('height', this.panels.getStyle('height').toInt() - this.controls.getStyle('height').toInt());
            
            // set video duration
            this.controls.duration.update(video.duration);
            
            // Fixed height for playlist...
            (function () {
                var el      = self.panels.playlist.getChildren('div:nth-child(2)')[0],
                    height  = 0,
                    content = el.getChildren().clone();
                
                el.empty();
                height = el.getStyle('height');
                el.adopt(content);
                el.getFirst().setStyle('height', height);
                $$(self.panels.playlist, self.panels.playlist.getChildren()).setStyle('display', 'block');
                // Holy crap, that is ugly. One day, CSS will actually be able to lay out inferfaces. Or maybe not.
            })();
            
            this.controls.progress.slider = new Slider(this.controls.progress.bar,
                this.controls.progress.knob, {
                    snap: 0,
                    mode: 'horizontal',
                    steps: 100,
                    initialStep: 0,
                    offset: -this.controls.progress.knob.getStyle('left').toInt(),
                    onChange: function (step) {
                        video.currentTime = video.duration * step / this.steps;
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
            
            this.attach();
            
            if ( ! video.autoplay) {
                self.overlay.update('play');
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
         * Adds all the required event listeners to the player.
         * 
         * @this {Doit}
         * @return {Doit} The instance on which this method was called.
         */
        attach: function () {
            var self = this, video = this.video;
            var muted = this._muted;
            
            this.player.addEvents({
                mouseenter: function (e) {
                    self.controls.fade('in');
                },
                
                mouseleave: function (e) {
                    if (self.options.autohideControls) {
                        self.controls.fade('out');
                    }
                }
            });
            
            $$(this.overlay.play, this.overlay.replay).addEvent('click', function (e) {
                video.play();
                self.title.show();
            });
            
            this.overlay.paused.addEvent('click', this.video.play.bind(this.video));
            
            this.panels.addEvent('click:relay(.checkbox-widget)', function (e) {
                if (this.get('data-checked') === 'false') {
                    this.set('data-checked', 'true');
                } else {
                    this.set('data-checked', 'false');
                }
                
                var control = this.get('data-control');
                var checked = this.get('data-checked');
                
                switch (control) {
                    case 'autohideControls':
                        self.options.autohideControls = (checked === 'true');
                        break;
                        
                    case 'loop':
                        video.loop = checked === 'true';
                        break;
                        
                    case 'captions':
                        self.options.captions = checked === 'true';
                        break;
                }
                
                self.panels.update('none');
            });
            
            this.playlist.addEvent('click:relay(.label)', function (e) {
                e.stop();

                var index = this.getParents('li')[0].get('data-index');
                self.playlist.select(index);
            });
            
            this.controls.play.addEvent('click', this.togglePlayback.bind(this));
            this.controls.stop.addEvent('click', this.video.stop.bind(this.video));
            
            if (this.playlist.length > 1) {
                this.controls.previous.addEvent('click', this.playlist.previous.bind(this.playlist));
                this.controls.next.addEvent('click', this.playlist.next.bind(this.playlist));
            }
            
            // display time tooltip when hovering over track
            this.controls.progress.addEvents({
                mousemove: function (e) {
                    if ( ! e.target.hasClass('knob')) {
                        var offsetPx = e.page.x - this.getPosition().x;
                        var offsetPc = offsetPx / this.bar.getSize().x * 100;
                        var value = (video.duration || 0) / 100 * offsetPc;
                        
                        self.controls.progress.time.setTime(value, offsetPx);
                    }
                },
                
                mouseleave: function (e) {
                    this.time.fade('hide');
                }
            });
            
            // display time tooltip when over knob
            this.controls.progress.knob.addEvents({
                mouseenter: function (e) {
                    var parent = this.getParent('.progress');
                    var knobX = -parent.slider.options.offset;
                    var barX = parent.bar.getPosition().x;
                    var offset = this.getPosition().x - barX - knobX;
                    
                    parent.time.setTime(video.currentTime, offset);
                },
                
                mouseleave: function (e) {
                    this.getParent('.progress').time.fade('hide');
                }
            });
            
            this.controls.volume.mute.addEvent('click', function (e) {
                video.muted = !video.muted;
            });
            
            this.controls.volume.addEvents({
                mouseenter: function (e) {
                    this.popup.fade('in');
                },
                
                mouseleave: function (e) {
                    this.popup.fade('out')
                }
            });
            
            this.controls.more.addEvents({
                mouseenter: function (e) {
                    this.popup.fade('in');
                },
                
                mouseleave: function (e) {
                    this.popup.fade('out');
                }
            });
            
            $$(this.controls.settings,
            this.controls.more).addEvent('click', function (e) {
                if (e.target.hasClass('settings')) {
                    self.panels.update('settings');
                } else if (e.target.hasClass('playlist')) {
                    self.panels.update('playlist')
                } else if (e.target.hasClass('about')) {
                    self.panels.update('about');
                } else if (e.target.hasClass('info')) {
                    self.panels.update('info');
                }
            });
            
            this.controls.fullscreen.addEvent('click', this.toggleFullscreen.bind(this));
            
            video.addEvents({
                click: function (e) {
                    video.pause();
                    self.overlay.update('paused');
                },

                play: function (e) {
                    self.controls.play.update();
                    self.overlay.update('none');
                },

                pause: function (e) {
                    self.controls.play.update();
                    self.overlay.update('paused');
                },

                ended: function (e) {
                    if (self.playlist.length > 1) {
                        self.playlist.next();
                    } else {
                        self.controls.play.update();
                        self.overlay.update('replay');
                    }
                },

                progress: function (e) {
                    var max = parseInt(video.duration, 10);
                    var vb = video.buffered;
                    
                    if (vb && vb.length) {
                        var buffer = parseInt(vb.end(0) - vb.start(0), 10);
                        var pct = (buffer * 100) / max;
                        self.controls.progress.buffered.setStyle('width', pct + '%');
                    }
                },

                seeking: function (e) {
                    self.overlay.update('buffering');
                },

                seeked: function (e) {
                    self.overlay.update('none');
                    
                    if ( ! video.paused) {
                        self.controls.play.update();
                    }
                },

                timeupdate: function (e) {
                    self.controls.currentTime.update(video.currentTime);
                    
                    // update seekbar ".knob" knob
                    var slider = self.controls.progress.slider;
                    if ( ! slider.isDragging) {
                        var position = video.currentTime / video.duration * slider.range;
                        position = slider.toPosition(position);
                        slider.knob.setStyle(slider.property, position);
                    }
                    
                    // update seekbar ".played" bar
                    var duration = video.duration;
                    if (duration > 0) {
                        var pct = (video.currentTime / duration) * 100;
                        self.controls.progress.played.setStyle('width', pct + '%');
                    }

                    // Captions
                    var found = false;
                    var track = self.video.getFirst('track');
                    
                    if (track && track.cues && self.options.captions) {
                        track.cues.each(function (cue) {
                            if (self.video.currentTime >= cue.start &&
                                self.video.currentTime <= cue.end) {
                                self.captions.caption.set('html', cue.text);
                                self.captions.show();
                                found = true;
                            }
                        });
                    }

                    if ( ! found) {
                        self.captions.caption.set('html', '');
                        self.captions.hide();
                    }
                },

                durationchange: function (e) {
                    self.controls.duration.update(video.duration);
                },

                volumechange: function (e) {
                    var mutedChanged = muted !== video.muted ? true : false;
                    muted = video.muted;

                    if (mutedChanged && !video.muted && video.volume === 0) {
                        // Un-muted with volume at 0 -- pick a sane default. This is probably the only deviation from the way the YouTube flash player handles volume control.
                        video.volume = 0.5;
                    } else if (video.muted && video.volume !== 0 && !mutedChanged) {
                        // IF volume changed while muted, THEN un-mute
                        video.muted = false;
                    } else if (!mutedChanged && !video.muted && video.volume === 0) {
                        // IF slider dragged to 0, THEN mute
                        video.muted = true;
                    }

                    if (video.muted) {
                        self.controls.volume.mute.addClass('muted');
                    } else {
                        self.controls.volume.mute.removeClass('muted');
                    }
                    
                    if ( ! self.controls.volume.slider.isDragging) {
                        var knob = self.controls.volume.knob;
                        // If muted, assume 0 for volume to visualize the muted state in the slider as well. Don't actually change the volume, though, so when un-muted, the slider simply goes back to its former value.
                        var volume = video.muted && mutedChanged ? 0 : video.volume;
                        var barSize = self.controls.volume.bar.getSize().y;
                        var offset = barSize - volume * barSize;
                        knob.setStyle('top', offset + -self.controls.volume.slider.options.offset);
                    }
                }
            });
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
            var isFullscreen = document.fullscreenElement || document.webkitFullscreenElement ||
                document.mozFullScreenElement || document.msFullscreenElement;
            
            if (isFullscreen) {
                if (document.exitFullscreen) { document.exitFullscreen(); }
                else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
                else if (document.webkitCancelFullScreen) { document.webkitCancelFullScreen(); }
                else if (document.msExitFullscreen) { document.msExitFullscreen(); }
            } else {
                if (this.player.requestFullscreen) { this.player.requestFullscreen(); }
                else if (this.player.mozRequestFullScreen) { this.player.mozRequestFullScreen(); }
                else if (this.player.webkitRequestFullScreen) { this.player.webkitRequestFullScreen(); }
                else if (this.player.msRequestFullscreen) { this.player.msRequestFullscreen(); }
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
            el.video.Moovie = new Doit(el.video, Object.merge(options, el.options));
        }
    });
};
