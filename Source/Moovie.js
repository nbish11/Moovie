/*
---
description: An advanced HTML5 video player for MooTools.

version: 0.6.2

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
    
    // keep in mind you must call next() 
    // to select the first item.
    var Iterator = new Class({
        index: -1,
        collection: [],
        legth: 0,
        
        initialize: function (collection) {
            this.collection.combine(collection);
            this.length = this.collection.length;
        },
        
        rewind: function () {
            this.index = -1;
            return this;
        },
        
        hasPrevious: function () {
            return this.index > 0;
        },
        
        previous: function () {
            if (this.hasPrevious()) {
                this.index = this.index - 1;
                return this.current();
            }
            
            return false;
        },
        
        hasNext: function () {
            return this.index < this.collection.length - 1;
        },
        
        next: function () {
            if (this.hasNext()) {
                this.index = this.index + 1;
                return this.current();
            }
            
            return false;
        },
        
        current: function () {
            return this.collection[this.index];
        },
        
        each: function (callback, bind) {
            var active = this.index;
            this.rewind();
            
            while (this.hasNext()) {
                var current = this.next();
                callback.call(bind || this, this.index, current,
                    active === -1 ? 0 : active);
            }
            
            this.index = active;
        }
    });
    
    var MediaSlider = new Class({
        Implements: [Events, Options],
        options: {
            mode: 'horizontal'    // horizontal:x, vertical:y
        },
        
        initialize: function (knob, bar, options) {
            this.knob = document.id(knob);
            this.bar = document.id(bar);
            this.setOptions(options);
            this.mode = this.options.mode === 'vertical' ? 'y' : 'x';
            this.dragging = false;
            this.offset = this.getOffset();
            this.drag = new Drag(this.knob, {
                snap: 0,
                modifiers: this.mode === 'y' ? { x: false } : { y: false },
                onStart: this.start.bind(this),
                onCancel: this.cancel.bind(this),
                onComplete: this.complete.bind(this),
                onDrag: this.drag.bind(this)
            });
        },
        
        start: function (el, e) {
            this.dragging = true;
        },
        
        cancel: function (el, e) {
            this.dragging = true;
        },
        
        complete: function (el, e) {
            this.dragging = false;
            this.fireEvent('complete', [e]);
        },
        
        drag: function (el, e) {
            var xy = this.bar.getPosition()[this.mode];
            var wh = this.bar.getSize()[this.mode];
            var style = this.mode === 'y' ? 'top' : 'left';
            var page = e.page[this.mode];
            
            if (page < xy) { this.knob.setStyle(style, this.offset); }
            else if (page > xy + wh) { this.knob.setStyle(style, this.offset + wh); }
            
            this.dragging = true;
            this.fireEvent('drag', [e]);
        },
        
        getOffset: function () {
            return this.knob.getStyle(this.mode === 'y' ? 'top' : 'left').toInt();
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
            captions: null,
            showCaptions: true,
            captionLang: 'en'
        },
        
        initialize: function (element, options) {
            // reference to <video> tag
            this.element = document.id(element);
            
            // set default title in options
            this.options.title = new URI(this.element.src).get('file');
            
            // overide defaults with user provided options
            this.setOptions(options);
            
            // Add the current video to the playlist stack
            if (typeOf(this.options.playlist) === 'string') {
                var data = null;
                var request = new Request.JSON({
                    method: 'GET',
                    url: this.options.playlist,
                    async: false,
                    onSuccess: function (responseJSON) {
                        data = responseJSON;
                    }
                }).send();
                
                data.unshift({
                    id: this.options.id,
                    src: this.element.src,
                    title: this.element.title || this.options.title
                });
                
                this.playlist = new Iterator(data);
            } else {
                // This will be removed for the "Milestone 1.0.0" release.
                // This is only here for backwards compatibility.
                this.options.playlist.unshift({
                    id: this.options.id,
                    src: this.element.src,
                    title: this.options.title
                });
                
                this.playlist = new Iterator(this.options.playlist);
            }
            
            // Set to first item.
            this.playlist.next();
            
            // turn off HTML5 native video controls
            this.element.controls = false;
            
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
            this._muted = this.element.muted;
            
            // Track fullscreen state. Defaults to false, seems reasonable enough anyway.
            this._fullscreen = false;
            
            // build Moovie
            this.build();
        },
        
        TrackInstances: true,
        
        build: function () {
            // create some wrappers
            var wrapper = new Element('div.player').wraps(this.element),
                container = new Element('div.moovie').wraps(wrapper);
                
            this._wrapper = wrapper;        // player
            this._container = container;    // wraps player and debug
            
            // build debug
            if (this.options.debug) {
                this.debug = new Debug(this.element);
                $(this.debug).inject(container);
            }
            
            // build player
            this.buildPlayer(wrapper, container);
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
        
        buildPlayer: function (wrapper, container) {
            // references - so I don't have to bind
            var video = this.element,
                options = this.options,
                muted = this._muted,
                self = this;
            
            // Captions ----------------------------------------------------------------
            var captions        = new Element('div.captions');
            captions.caption    = new Element('p');
            
            captions.grab(captions.caption);
            captions.hide();

            // Overlay -----------------------------------------------------------------
            var overlay         = new Element('div.overlay');
            overlay.wrapper     = new Element('div.wrapper');
            overlay.buffering   = new Element('div.buffering[text=Buffering...]');
            overlay.play        = new Element('div.play[text=Play Video]');
            overlay.replay      = new Element('div.replay[text=Replay]');
            overlay.paused      = new Element('div.paused[text=Paused]');
            
            overlay.wrapper.adopt(overlay.buffering, overlay.play, overlay.replay, overlay.paused);
            overlay.grab(overlay.wrapper);
            
            overlay.set('tween', {duration: 50});
            overlay.fade('hide');
            
            // build title and hide
            this.buildTitle();

            // Panels ------------------------------------------------------------------
            var panels          = new Element('div.panels');
            panels.info         = new Element('div.info');
            panels.settings     = new Element('div.settings');
            panels.about        = new Element('div.about');
            panels.playlist     = new Element('div.playlist');

            panels.adopt(panels.info, panels.settings, panels.about, panels.playlist);

            panels.set('tween', {duration: 250});
            panels.fade('hide');

            // Content for `info` panel
            panels.info.set('html', '\
                <div class="heading">Video information</div>\
                \
                <dl>\
                    <dt class="title">Title</dt>\
                    <dd>' + options.title + '</dd>\
                    \
                    <dt class="url">URL</dt>\
                    <dd>' + video.src + '</dd>\
                    \
                    <dt class="size">Size</dt>\
                    <dd></dd>\
                </dl>\
            ');

            // Content for `settings` panel
            panels.settings.set('html', '\
                <div class="heading">Settings</div>\
                \
                <div class="checkbox-widget" data-control="autohideControls" data-checked="' + options.autohideControls + '">\
                    <div class="checkbox"></div>\
                    <div class="label">Auto-hide controls</div>\
                </div>\
                \
                <div class="checkbox-widget" data-control="loop" data-checked="' + (video.loop || false) + '">\
                    <div class="checkbox"></div>\
                    <div class="label">Loop video</div>\
                </div>\
                \
                <div class="checkbox-widget" data-control="showCaptions" data-checked="' + options.showCaptions + '">\
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

            // Content for `playlist` panel
            panels.playlist.set('html', '\
                <div><div class="heading">Playlist</div></div>\
                <div><ol class="playlist"></ol></div>\
            ');
            
            // content for playlist
            this.playlist.each(function (index, item, active) {
                panels.playlist.getElement('ol.playlist').grab(new Element('li', {
                    'data-index': index,
                    'class': (index === active ? 'active' : ''),
                    'html': '\
                        <div class="checkbox-widget" data-checked="true">\
                            <div class="checkbox"></div>\
                            <div class="label">' + item.title + '</div>\
                        </div>\
                '}));
            });

            // Controls ----------------------------------------------------------------
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
            
            controls.volume.popup.adopt(controls.volume.bar, controls.volume.knob);
            controls.volume.wrapper.adopt(controls.volume.mute, controls.volume.popup);
            controls.volume.grab(controls.volume.wrapper);
            
            controls.volume.popup.fade('hide');
            controls.volume.popup.set('tween', {duration: 150});

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
            controls.more.popup.set('tween', {duration: 150});
            
            controls.wrapper.adopt(
                controls.play, controls.stop, controls.previous,
                controls.next, controls.currentTime, controls.progress,
                controls.duration, controls.volume, controls.settings,
                controls.more, controls.fullscreen
            );
            
            controls.grab(controls.wrapper);
            controls.set('tween', {duration: 150});
            
            // Inject and do some post-processing --------------------------------------
            wrapper.adopt(captions, overlay, self.title, panels, controls);

            // Adjust height of panel container to account for controls bar
            panels.setStyle('height', panels.getStyle('height').toInt() - controls.getStyle('height').toInt());
            
            // Fixed height for playlist...
            (function () {
                var el      = panels.playlist.getChildren('div:nth-child(2)')[0],
                    height  = 0,
                    content = el.getChildren().clone();
                
                el.empty();
                height = el.getStyle('height');
                el.adopt(content);
                el.getFirst().setStyle('height', height);
                $$(panels.playlist, panels.playlist.getChildren()).setStyle('display', 'block');
                // Holy crap, that is ugly. One day, CSS will actually be able to lay out inferfaces. Or maybe not.
            })();
            
            // Make seekbar draggable
            controls.progress.slider = new MediaSlider(controls.progress.knob,
                controls.progress.bar, {
                    mode: 'horizontal',
                    onDrag: function (e) {
                        controls.progress.time.update(true, e.page.x);
                    },
                    
                    onComplete: function (e) {
                        video.currentTime = self.locToTime(e.page.x, controls, video);
                        if (video.paused) { video.play(); }
                    }
                }
            );

            // make volume draggable
            controls.volume.slider = new MediaSlider(controls.volume.knob,
                controls.volume.bar, {
                    mode: 'vertical',
                    onDrag: function (e) {
                        video.volume = self.locToVolume(e.page.y, controls);
                    }
                }
            );

            // Methods - overlay.update
            overlay.update = function (which) {
                if (which === 'none') {
                    this.fade('out');
                } else {
                    this.wrapper.getChildren().hide();
                    this[which].show();
                    this.fade('in');
                }
            };

            // Methods - panels.update
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
            
            // Methods - panels.playlist.play
            panels.playlist.play = function (action) {
                var current = self.playlist.current();

                if (action === 'previous') {
                    if (self.playlist.hasPrevious()) {
                        current = self.playlist.previous();
                        
                    // change this to a "no more previous videos in playlist" message?
                    } else {
                        self.playlist.index = self.playlist.length - 1;
                        current = self.playlist.current();
                    }
                } else if (action === 'next') {
                    if (self.playlist.hasNext()) {
                        current = self.playlist.next();
                    
                    // change this to a "last video in playlist" message?
                    } else {
                        self.playlist.rewind().next();
                        current = self.playlist.current();
                    }
                } else if (typeOf(action) === 'number') {
                    if (action >= 0 && action < self.playlist.length - 1) {
                        self.playlist.index = action;
                        current = self.playlist.current();
                    }
                }

                panels.playlist.setActive(self.playlist.index);

                video.src = current.src;
                if (current.poster) {video.poster = current.poster;}
                
                video.load();
                video.play();
                
                self.title.setText(current.title + '').show();
                panels.info.getElement('dt.title + dd').set('html', (current.title || new URI(current.src).get('file')));
                panels.info.getElement('dt.url + dd').set('html', current.src);
            };
            
            // Methods - panels.playlist.getActive
            panels.playlist.getActive = function () {
                var current = panels.playlist.getElement('ol.playlist li.active');
                var index = +current.get('data-index');
                return { 'element': current, 'index': index };
            };
            
            // Methods - panels.playlist.setActive
            panels.playlist.setActive = function (index) {
                var active = panels.playlist.getActive().element.removeClass('active');
                panels.playlist.getElement('ol.playlist li[data-index="' + index + '"]').addClass('active');
            };

            // Methods - controls.play.update
            controls.play.update = function (action) {
                if (video.paused || video.ended) {
                    this.removeClass('paused');
                } else {
                    this.addClass('paused');
                }
            };
            
            // Methods - controls.progress.update
            controls.progress.update = function (action) {
                if ( ! controls.progress.slider.dragging) {
                    var el = controls.progress.knob;
                    var pct = video.currentTime / video.duration * 100;
                    var width = controls.progress.bar.getSize().x;
                    var offset = (width / 100) * pct;
                    el.setStyle('left', offset + controls.progress.slider.offset + 'px');
                }
            };
            
            // Methods - controls.progress.time.update
            controls.progress.time.update = function (offset, knob) {
                controls.progress.time.fade('show');
                var barX = controls.progress.bar.getPosition().x;
                
                if ( ! knob) {
                    controls.progress.time.setStyle('left', offset - barX + 'px');
                } else {
                    var sliderX = controls.progress.knob.getPosition().x;
                    controls.progress.time.setStyle('left', sliderX - barX - controls.progress.slider.offset + 'px');
                    offset = sliderX - controls.progress.slider.offset;
                }
                
                this.getFirst().set('text', self.parseTime(self.locToTime(offset, controls, video)));
            };
            
            // Methods - controls.volume.update
            controls.volume.update = function (action) {
                //var mutedChanged = !(muted === video.muted);
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
                    controls.volume.mute.addClass('muted');
                } else {
                    controls.volume.mute.removeClass('muted');
                }
                
                if ( ! controls.volume.slider.dragging) {
                    var knob = controls.volume.knob;
                    // If muted, assume 0 for volume to visualize the muted state in the slider as well. Don't actually change the volume, though, so when un-muted, the slider simply goes back to its former value.
                    var volume = video.muted && mutedChanged ? 0 : video.volume;
                    var barSize = controls.volume.bar.getSize().y;
                    var offset = barSize - volume * barSize;
                    knob.setStyle('top', offset + controls.volume.slider.offset);
                }
            };
            
            // Methods - controls.currentTime.update
            controls.currentTime.update = controls.duration.update = function (time) {
                this.set('text', self.parseTime(time));
            };
            
            // Events - Masthead
            // wrap mouseenter and mouseleave in if?
            wrapper.addEvent('mouseenter', function (e) {
                controls.fade('in');
            });
            
            wrapper.addEvent('mouseleave', function (e) {
                if (options.autohideControls) {
                    controls.fade('out');
                }
            });
            
            // Events - Overlay
            $$(overlay.play, overlay.replay).addEvent('click', function (e) {
                video.play();
                self.title.show();
            });

            $$(overlay.paused).addEvent('click', function (e) {
                video.play();
            });
            
            // Events - Panels (Checkbox widgets)
            panels.addEvent('click:relay(.checkbox-widget)', function (e) {
                if (this.get('data-checked') === 'false') {
                    this.set('data-checked', 'true');
                } else {
                    this.set('data-checked', 'false');
                }

                var control = this.get('data-control');
                var checked = this.get('data-checked');

                switch (control) {
                    case 'autohideControls':
                        options.autohideControls = checked === 'true';
                        break;

                    case 'loop':
                        video.loop = checked === 'true';
                        break;

                    case 'showCaptions':
                        options.showCaptions = checked === 'true';
                        break;
                }
            });

            panels.playlist.addEvent('click:relay(.label)', function (e) {
                e.stop();

                var item = this.getParents('li')[0];
                var index = +item.get('data-index');
                panels.playlist.play(index);
            });
            
            // Events - controls.playback.play
            controls.play.addEvent('click', function (e) {
                if (video.paused && video.readyState >= 3) {
                    video.play();
                } else if (!video.paused && video.ended) {
                    video.currentTime = 0;
                } else if (!video.paused) {
                    video.pause();
                }
            });
            
            // Events - controls.playback.stop
            controls.stop.addEvent('click', function (e) {
                video.currentTime = 0;
                video.pause();
            });
            
            // Events - controls.playback.previous
            // Events - controls.playback.next
            if (this.playlist.length > 1) {
                controls.previous.addEvent('click', function (e) {
                    panels.playlist.play('previous');
                });

                controls.next.addEvent('click', function (e) {
                    panels.playlist.play('next');
                });
            }
            
            // Events - controls.progress.bar
            controls.progress.bar.addEvent('click', function (e) {
                video.currentTime = self.locToTime(e.page.x, controls, video);
                if (video.paused) { video.play(); }
            });
            
            // Events - controls.progress.bar
            controls.progress.bar.addEvent('mousemove', function (e) {
                controls.progress.time.update(e.page.x, false);
            });
            
            // Events - controls.progress.slider
            controls.progress.knob.addEvent('mouseenter', function (e) {
                controls.progress.time.update(e.page.x, true);
            });
            
            // Events - controls.progress.bar
            controls.progress.bar.addEvent('mouseleave', function (e) {
                controls.progress.time.fade('hide');
            });
            
            // Events - controls.progress.slider
            controls.progress.knob.addEvent('mouseleave', function (e) {
                controls.progress.time.fade('hide');
            });
            
            // Events - controls.volume.mute
            controls.volume.mute.addEvent('click', function (e) {
                video.muted = !video.muted;
            });
            
            // Events - controls.volume.show
            controls.volume.addEvent('mouseenter', function (e) {
                controls.volume.popup.fade('in');
            });
            
            // Events - controls.volume.hide
            controls.volume.addEvent('mouseleave', function (e) {
                controls.volume.popup.fade('out');
            });
            
            // Events - controls.volume.setVolume
            controls.volume.bar.addEvent('click', function (e) {
                video.volume = self.locToVolume(e.page.y, controls);
            });
            
            // Events - controls.more.show
            controls.more.addEvent('mouseenter', function (e) {
                controls.more.popup.fade('in');
            });
            
            // Events - controls.more.hide
            controls.more.addEvent('mouseleave', function (e) {
                controls.more.popup.fade('out');
            });
            
            // Events - controls.more.about
            controls.more.about.addEvent('click', function (e) {
                panels.update('about');
            });
            
            // Events - controls.more.info
            controls.more.info.addEvent('click', function (e) {
                panels.update('info');
            });
            
            // Events - controls.more.playlist
            controls.more.playlist.addEvent('click', function (e) {
                panels.update('playlist');
            });
            
            // Events - controls.playback.settings
            controls.settings.addEvent('click', function (e) {
                panels.update('settings');
            });
            
            // Events - controls.playback.fullscreen
            controls.fullscreen.addEvent('click', function (e) {
                if (self._fullscreen) {
                    self.cancelFullScreen();
                } else {
                    self.requestFullScreen();
                }
            });
            
            video.addEvents({
                click: function (e) {
                    video.pause();
                    overlay.update('paused');
                },

                play: function (e) {
                    controls.play.update();
                    overlay.update('none');
                },

                pause: function (e) {
                    controls.play.update();
                },

                ended: function (e) {
                    if (this.playlist.length > 1) {
                        panels.playlist.play('next');
                    } else {
                        controls.play.update();
                        overlay.update('replay');
                    }
                },

                progress: function (e) {
                    var max = parseInt(video.duration, 10);
                    var vb = video.buffered;
                    
                    if (vb && vb.length) {
                        var buffer = parseInt(vb.end(0) - vb.start(0), 10);
                        var pct = (buffer * 100) / max;
                        controls.progress.buffered.setStyle('width', pct + '%');
                    }
                },

                seeking: function (e) {
                    overlay.update('buffering');
                },

                seeked: function (e) {
                    overlay.update('none');
                    
                    if ( ! video.paused) {
                        controls.play.update();
                    }
                },

                timeupdate: function (e) {
                    controls.currentTime.update(video.currentTime);
                    controls.progress.update();
                    
                    // seekbar > bar
                    var duration = video.duration;
                    if (duration > 0) {
                        var pct = (video.currentTime / duration) * 100;
                        controls.progress.played.setStyle('width', pct + '%');
                    }

                    // Captions
                    var found = false;
                    
                    var ref = Moovie.captions[self.playlist.current().id];
                    if (ref && options.showCaptions) {
                        ref[options.captionLang].each(function (caption) {
                            if (video.currentTime >= caption.start && video.currentTime <= caption.end) {
                                captions.caption.set('html', caption.text);
                                captions.show();
                                found = true;
                            }
                        });
                    }
                    

                    if ( ! found) {
                        captions.caption.set('html', '');
                        captions.hide();
                    }
                },

                durationchange: function (e) {
                    controls.duration.update(video.duration);
                },

                volumechange: function (e) {
                    controls.volume.update();
                },

                abort: function (e) {
                    // video.Moovie = null;
                    // Doit(video);
                },

                emptied: function (e) {
                    // video.Moovie = null;
                    // Doit(video);
                }
            });

            if ( ! video.autoplay) {
                overlay.update('play');
            }

            var tips = new Tips(wrapper.getElements('[title]'), {
                className: 'video-tip',
                title: '',
                text: function (el) {
                    return el.get('title');
                }
            });
        },
        
        // Parses a float value in seconds (from video.currentTime etc) to normal time format
        parseTime: function (val) {
            var rest = 0,
                hrs = 0,
                mins = 0,
                secs = 0,
                time = '';

            hrs = (val / 3600).toInt();
            rest = val % 3600;
            mins = (rest / 60).toInt();
            rest = rest % 60;
            secs = rest.toInt().toString();

            if (secs.length === 1) {
                secs = '0' + secs;
            }
            
            if (hrs !== 0) {
                time += hrs + ':';
            }
            
            return time + mins + ':' + secs;
        },
        
        // Calculates offset for progress bar slider based on page location
        locToTime: function (val, controls, video) {
            var barX = controls.progress.bar.getPosition().x;
            var barW = controls.progress.bar.getSize().x;
            var offsetPx = val - barX;
            var offsetPc = offsetPx / barW * 100;
            var time = (video.duration || 0) / 100 * offsetPc;
            return time;
        },
        
        // Calculates offset for volume bar slider based on page location
        locToVolume: function (val, controls) {
            var barY = controls.volume.bar.getPosition().y;
            var barH = controls.volume.bar.getSize().y;
            var offsetPx = val - barY;
            var offsetPc = offsetPx / barH * 100;
            var volume = 1 - (1 / 100 * offsetPc).limit(0, 1);
            return volume;
        },
        
        requestFullScreen: function () {
            if (this._wrapper.requestFullscreen) { this._wrapper.requestFullscreen(); }
            else if (this._wrapper.mozRequestFullScreen) { this._wrapper.mozRequestFullScreen(); }
            else if (this._wrapper.webkitRequestFullScreen) { this._wrapper.webkitRequestFullScreen(); }
            else if (this._wrapper.msRequestFullscreen) { this._wrapper.msRequestFullscreen(); }
            this._fullscreen = true;
        },
        
        // I hate using exitFullscreen(), cancelFullscreen sounds much nicer.
        cancelFullScreen: function () {
            if (document.exitFullscreen) { document.exitFullscreen(); }
            else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
            else if (document.webkitCancelFullScreen) { document.webkitCancelFullScreen(); }
            else if (document.msExitFullscreen) { document.msExitFullscreen(); }
            this._fullscreen = false;
        },
        
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
            el.options.captions = Moovie.captions[el.id] || null;
            el.video.Moovie = new Doit(el.video, Object.merge(options, el.options));
        }
    });
};

// Public static properties
Moovie.captions = {};

// You can add additional language definitions here
Moovie.languages = {
    'en': 'English'
};

// register and load captions
Moovie.registerCaptions = function (videoid, tracksrc, tracklang) {
    tracklang = tracklang || 'en';
    
    var parser = function (data) {
        var cues = [];
        
        // return an srt formated time fo seconds
        var toSeconds = function (t) {
            t = t.split(/[:,]/);
            return parseFloat(t[0], 10) * 3600 +
                parseFloat(t[1], 10) * 60 +
                parseFloat(t[2], 10) +
                parseFloat(t[3], 10) / 1000;
        };
        
        // Replace all newline characters with "\n" then split on
        // every occurrence of "\n\n"; aka each cue.
        data = data.replace(/\r?\n/gm, '\n').split('\n\n');
        
        data.forEach(function (cue) {
            cue = cue.split('\n');
            
            var id = cue.shift(),
                time = cue.shift().split(/[\t ]*-->[\t ]*/),
                
                // for if the text contains multiple lines
                text = cue.join('<br />');
                
            cues.push({
                id: id,
                start: toSeconds(time[0]),
                end: toSeconds(time[1]),
                text: text
            });
        });
        
        return cues;
    };
    
    // an array of cues, each one is an object with the
    // following: id, start, end, text
    var reply = [];
    
    var request = new Request({
        method: 'GET',
        url: tracksrc,
        async: false,
        onSuccess: function (responseText) {
            reply = parser(responseText);
        }
    }).send();
    
    var captions = {};
    captions[tracklang] = reply;
    this.captions[videoid] = captions;
};
