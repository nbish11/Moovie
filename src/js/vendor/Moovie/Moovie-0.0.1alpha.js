/**
 * Moovie - version 0.2.3 - 14/04/2014
 * 
 * Demo:   http://colinaarts.com/code/moovie
 * Source: https://github.com/nbish11/Moovie
 *
 * The MIT License (MIT)
 * 
 * Copyright (c) 2010 Colin Aarts
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
 
 /*
---

script: Class.Mutators.TrackInstances.js

description: Allows a class to track its instances by having instances array as a class property

license: MIT-style license

authors:
- Elad Ossadon ( http://devign.me | http://twitter.com/elado )

requires:
- core:1.2.4

provides: [Class.Mutators.TrackInstances]

...
*/

Class.Mutators.TrackInstances = function (allow) {
    if (!allow) { return; }

    // save current initialize method
    var oldInit = this.prototype.initialize;
    var klass = this;

    // overwrite initialize method
    klass.prototype.initialize = function () {
        (klass.instances = klass.instances || []).push(this);
        oldInit.apply(this, arguments);
    };
};
 
// The HTML5 media events API is not natively supported by MooTools yet.
if (!Element.NativeEvents.timeupdate) {
    Element.NativeEvents = Object.merge({
        loadstart: 2,
        progress: 2,
        suspend: 2,
        abort: 2,
        error: 2,
        emptied: 2,
        stalled: 2,
        play: 2,
        pause: 2,
        loadedmetadata: 2,
        loadeddata: 2,
        waiting: 2,
        playing: 2,
        canplay: 2,
        canplaythrough: 2,
        seeking: 2,
        seeked: 2,
        timeupdate: 2,
        ended: 2,
        durationchange: 2,
        volumechange: 2
    }, Element.NativeEvents);
}
 
var Moovie = new Class({
    Implements: [Events, Options],
    
    options: {
        debug: false,
        playlist: [],
        width: 0,
        height: 0,
        ratio: '',
        disabled: false,    // event listeners are detached
        container: null,    // you may specify an alternative container for the player/debug
        title: '',
        description: '',
        poster: '',
        captions: true,        //display captions
        autohide: true
    },
    
    fullscreen: false,
    
    initialize: function (video, options) {
        this.video = document.id(video);
        this.setOptions(options);
        
        this.bound = {
            stop: this.stop.bind(this),
            togglePlayback: this.togglePlayback.bind(this),
            toggleFullscreen: this.toggleFullscreen.bind(this),
            toggleMute: this.toggleMute.bind(this),
            showCaptions: this.showCaptions.bind(this),
            hideCaptions: this.hideCaptions.bind(this)
        };
        
        // Unfortunately, the media API only defines one volume-related event: 
        // 'volumechange'. This event is fired whenever the media's 'volume'
        // attribute changes, or the media's 'muted' attribute changes. The API
        // defines no way to discern the two, so we'll have to "manually" keep 
        // track. We need to do this in order to be able to provide the advanced 
        // volume control (a la YouTube's player): changing the volume can have 
        // an effect on the muted state and vice versa.
        this.muted = this.video.muted;
        
        // Track elements originally added to the video tag are wrapped
        // in a custom API, than stored here.
        this.track = null;
        
        // Manually keep track of loop state. This allows us to change the 
        // loop setting from the settings panel.
        this.loop = this.video.loop;
        
        // debug panel: instantiated but events have been disabled unit needed
        this.debug = new Moovie.Modules.Debug(this.video);
        this.debug.detach();
        
        // setup vars
        var options = this.options;
        var video = this.video;
        var track = video.getFirst('track').getProperties('src', 'srclang', 'label', 'kind') || {
            src: '',
            srclang: 'en',
            label: 'English',
            kind: 'subtitles'
        };
        
        // Add current video to playlist stack.
        options.playlist = new Moovie.Modules.Playlist(options.playlist);
        var length = options.playlist.data.unshift({
            id: options.id,
            src: video.currentSrc,
            title: options.title || video.get('title') || Moovie.utilities.basename(video.currentSrc),
            description: options.description,
            poster: options.poster || video.poster,
            track: track,
        });
        
        this.previous = this.options.playlist.previous.bind(this.options.playlist);
        this.next = this.options.playlist.next.bind(this.options.playlist);
        
        this.video.controls = false;
        if (!this.video.hasClass('video')) { this.video.addClass('video') }
        this.fireEvent('init');
        
        this.build();
        this.setup();
    },
    
    TrackInstances: true,
    
    build: function () {
        // grab some local ref
        var options = this.options,
            playlist = options.playlist,
            controls = options.controls;
    
        // find/build container for player and debug
        this.element = document.id(options.container) || new Element('div.moovie');
        this.element.setStyle('width', options.width || this.video.videoWidth);
        this.element.setStyle('height', options.height || this.video.videoHeight);
        
        // if player has been defined by use of the 
        // init event, don't bother doing anything.
        if (!this.player) {
            this.player = new Element('div.player');
            this.player.wraps(this.video);
            this.element.wraps(this.player);
        
            // build captions
            this.captions           = new Element('div.captions');
            this.captions.caption   = new Element('p');
            
            this.captions.grab(this.captions.caption);
            this.captions.setStyle('display', 'none');
            
            // build overlay
            this.overlay = new Moovie.ui.Overlay();
            this.overlay.add('buffering', new Element('div.modal[text=Buffering...]'));
            this.overlay.add('play', new Element('div.modal[text=Play video]'), true);
            this.overlay.add('replay', new Element('div.modal[text=Replay]'), true);
            this.overlay.add('resume', new Element('div.modal[text=Resume]'), true);
            
            // build title
            this.title = new Element('div.title[text=' + playlist.active().title + ']');
            this.title.set('tween', { "duration": 2000 });
            this.title.fade('hide');
            
            // build panels
            this.panels             = new Element('div.panels');
            this.panels.info        = new Element('div.info');
            this.panels.settings    = new Element('div.settings');
            this.panels.about       = new Element('div.about');
            this.panels.playlist    = new Element('div.playlist');

            this.panels.adopt(
                this.panels.info,
                this.panels.settings,
                this.panels.about,
                this.panels.playlist
            );
            
            this.panels.set('tween', { "duration": 250 });
            this.panels.fade('hide');

            // Content for `info` panel
            this.panels.info.set('html', '\
                <div class="heading">Video information</div>\
                \
                <dl>\
                    <dt class="title">Title</dt>\
                    <dd>' + playlist.active().title + '</dd>\
                    <dt class="url">URL</dt>\
                    <dd>' + playlist.active().src + '</dd>\
                    <dt class="size">Size</dt>\
                    <dd></dd>\
                </dl>\
            ');

            // Content for `settings` panel
            this.panels.settings.set('html', '\
                <div class="heading">Settings</div>\
                \
                <p>\
                    <input type="checkbox" id="option-autohide"' +
                    (options.autohide ? ' checked="checked"' : '') + ' />\
                    <label for="option-autohide">Autohide Controls</label>\
                </p>\
                <p>\
                    <input type="checkbox" id="option-loop"' +
                    (this.loop ? ' checked="checked"' : '') + ' />\
                    <label for="option-loop">Loop video</label>\
                </p>\
                <p>\
                    <input type="checkbox" id="option-captions"' +
                    (options.captions ? ' checked="checked"' : '') + ' />\
                    <label for="option-captions">Display Captions</label>\
                </p>\
                <p>\
                    <input type="checkbox" id="option-debug"' +
                    (options.debug ? ' checked="checked"' : '') + ' />\
                    <label for="option-debug">Enable debug</label>\
                </p>\
            ');

            // Content for `about` panel
            this.panels.about.set('html', '\
                <div class="heading">About this player</div>\
                \
                <p><b>Moovie</b> v1.0 <i>alpha</i></p>\
                <p>Copyright Â© 2010, Colin Aarts</p>\
                <p><a href="http://colinaarts.com/code/moovie/" rel="external">\
                http://colinaarts.com/code/moovie/</a></p>\
            ');

            // Wrapper content for `playlist` panel
            this.panels.playlist.set('html', '\
                <div><div class="heading">Playlist</div></div>\
                \
                <div><ol class="playlist"></ol></div>\
            ');
            
            // Populates the HTML playlist
            var olPlaylist = this.panels.playlist.getElement('ol.playlist');
            playlist.each(function (item, index) {
                olPlaylist.grab(new Element('li', {
                    "data-index": index,
                    "class": (index === playlist.index ? 'active' : ''),
                    "html": '\
                        <div class="checkbox-widget" data-checked="true">\
                            <div class="checkbox"></div>\
                            <div class="label">' + item.title + '</div>\
                        </div>\
                    '
                }));
            }, this);
            
            // Provides each panel with its own toggle method, which
            // will show that panel and hide all others.
            this.panels.getChildren().each(function (el, index) {
                el.toggle = function () {
                    if (el.hasClass('active')) {
                        this.panels.getChildren('.active').removeClass('active');
                        this.panels.fade('out');
                        this.panels.isActive = false;
                    } else {
                        this.panels.getChildren().setStyle('display', 'none').removeClass('active');
                        
                        // By setting display to '' we are using the developers
                        // CSS rules instead of our own.
                        el.setStyle('display', '').addClass('active');
                        this.panels.fade('in');
                        this.panels.isActive = true;
                    }
                }.bind(this);
            }.bind(this));

            // Buttons
            this.controls               = new Element('div.controls');
            this.controls.wrapper       = new Element('div.wrapper');
            this.controls.play          = new Element('div.play[title=Play]');
            this.controls.stop          = new Element('div.stop[title=Stop]');
            this.controls.elapsed       = new Element('div.current-time');
            this.controls.duration      = new Element('div.duration');
            this.controls.settings      = new Element('div.settings[title=Settings]');
            this.controls.fullscreen    = new Element('div.fullscreen[title=Fullscreen]');
            this.controls.previous      = playlist.length > 1 ? new Element('div.previous[title=Previous]') : null;
            this.controls.next          = playlist.length > 1 ? new Element('div.next[title=Next]') : null;

            // Seekbar
            this.controls.seekbar           = new Element('div.seekbar');
            this.controls.seekbar.slider    = new Moovie.ui.Slider({
                "tooltip": true,
                "lock": false
            });
            
            this.controls.seekbar.grab(this.controls.seekbar.slider);

            // Volume
            this.controls.volume        = new Element('div.volume');
            this.controls.volume.mute   = new Element('div.mute');
            this.controls.volume.popup  = new Element('div.popup.north');
            this.controls.volume.slider = new Moovie.ui.Slider({
                "mode": 'vertical',
                "reverse": true
            });
            
            this.controls.volume.popup.adopt(
                this.controls.volume.mute,
                new Element('span').adopt(
                    new Element('img'),
                    this.controls.volume.slider
                )
            );
            
            this.controls.volume.grab(
                this.controls.volume.popup
            );

            // More
            this.controls.more           = new Element('div.more');
            this.controls.more.wrapper   = new Element('div.wrapper');
            this.controls.more.popup     = new Element('div.popup');
            this.controls.more.about     = new Element('div.about[title=About]');
            this.controls.more.info      = new Element('div.info[title=Video info]');
            this.controls.more.playlist  = new Element('div.playlist[title=Playlist]');

            this.controls.more.popup.adopt(
                this.controls.more.about,
                this.controls.more.info,
                this.controls.more.playlist
            );
            
            this.controls.more.wrapper.grab(
                this.controls.more.popup
            );
            
            this.controls.more.grab(
                this.controls.more.wrapper
            );
            
            this.controls.more.popup.set('tween', { "duration": 150 });
            this.controls.more.popup.fade('hide');

            // Controls build
            this.controls.wrapper.adopt(
                this.controls.play,
                this.controls.stop,
                this.controls.previous,
                this.controls.next,
                this.controls.elapsed,
                this.controls.seekbar,
                this.controls.duration,
                this.controls.volume,
                this.controls.settings,
                this.controls.more,
                this.controls.fullscreen
            );
            
            this.controls.grab(
                this.controls.wrapper
            );
            
            this.player.adopt(
                this.captions,
                this.overlay,
                this.title,
                this.panels,
                this.controls
            );
            
            this.element.grab(this.player);
        }
    },
    
    setup: function () {
        // stuff for autohide option
        this.controls.timer = null;
        this.controls.fade('out');
    
        // Adjust height of panel container to account for controls bar
        this.panels.setStyle('height', this.panels.getStyle('height').toInt() - this.controls.getStyle('height').toInt());
        
        // this is for when video meta data was loaded before
        // Moovie was instantiated.
        if (this.video.readyState >= 1) {
            this.controls.elapsed.set('text', Moovie.utilities.parse(this.video.currentTime));
            this.controls.duration.set('text', Moovie.utilities.parse(this.video.duration));
            
            // load captions
            if (this.options.playlist.active().track) {
                this.track = new Moovie.Modules.Track(
                    this.options.playlist.active().track, this.video
                );
            }
            
            // set slider position to volume
            this.lockStep('volume', this.video.volume, 1);
        }
        
        // Show the "Play video" overlay.
        if (this.video.paused) {
            //this.overlay.play.show();
            this.overlay.show('play');
            this.controls.play.addClass('paused');
            this.controls.setStyle('display', 'none');
        }
        
        var tips = new Tips(this.player.getElements('[title]'), {
            className: 'video-tip',
            title: '',
            text: function (el) {
                return el.get('title');
            }
        });
        
        if (!this.options.disabled) { this.attach(); }
    },
    
    attach: function () {
        this.video.addEvents({
            click: this.onClick.bind(this),
            error: this.onError.bind(this),
            progress: this.onProgress.bind(this),
            loadedmetadata: this.onLoadedMetaData.bind(this),
            waiting: this.onWaiting.bind(this),
            seeked: this.onSeeked.bind(this),
            ended: this.onEnded.bind(this),
            durationchange: this.onDurationChange.bind(this),
            timeupdate: this.onTimeUpdate.bind(this),
            play: this.onPlay.bind(this),
            pause: this.onPause.bind(this),
            volumechange: this.onVolumeChange.bind(this)
        });
        
        this.player.addEvents({
            "mousemove": function (e) {
                clearTimeout(this.controls.timer);
                this.controls.fade('show');
                
                if (e.target.hasClass('video')) {
                    this.controls.timer = setTimeout(function () {
                        if (this.options.autohide) { this.controls.fade('out'); }
                    }.bind(this), 8000);
                }
            }.bind(this),
            
            "mouseleave": function (e) {
                clearTimeout(this.controls.timer);
                if (this.options.autohide) { this.controls.fade('out'); }
            }.bind(this)
        });
        
        this.addEvent('fullscreenchange', function () {
            this.controls.fullscreen.toggleClass('fullscreened');
        }.bind(this));
        
        // Subtitles
        if (this.options.captions && this.track) {
            this.track.addEvent('enter', this.bound.showCaptions);
            this.track.addEvent('end', this.bound.hideCaptions);
        }
        
        // playback handlers
        $$(this.controls.play, this.overlay.get('play'), this.overlay.get('resume'),
        this.overlay.get('replay')).addEvent('click', this.bound.togglePlayback);
        
        // controls
        this.controls.stop.addEvent('click', this.bound.stop);
        this.controls.volume.mute.addEvent('click', this.bound.toggleMute);
        this.controls.fullscreen.addEvent('click', this.bound.toggleFullscreen);
        this.controls.settings.addEvent('click', this.panels.settings.toggle);
        this.controls.more.about.addEvent('click', this.panels.about.toggle);
        this.controls.more.info.addEvent('click', this.panels.info.toggle);
        this.controls.more.playlist.addEvent('click', this.panels.playlist.toggle);
        
        // SELF NOTE: NEEDS TO BE REMOVED AND REPLACED WITH CSS HOVER EVENT.
        this.controls.more.addEvent('mouseenter', function (e) { this.controls.more.popup.fade('in'); }.bind(this));
        this.controls.more.addEvent('mouseleave', function (e) { this.controls.more.popup.fade('out'); }.bind(this));
        
        if (this.options.playlist.length > 1) {
            this.controls.previous.addEvent('click', this.previous);
            this.controls.next.addEvent('click', this.next);
            this.options.playlist.addEvents({
                previous: function (obj, i) { this.load(); }.bind(this),
                next: function (obj, i) { this.load(); }.bind(this)
            });
        }
        
        // sliders
        this.controls.seekbar.slider.addEvent('drag', function (e) {
            this.video.currentTime = e.step / e.limit * this.video.duration;
        }.bind(this));
        
        this.controls.volume.slider.addEvent('drag', function (e) {
            this.video.volume = e.step / e.limit * 1;
        }.bind(this));
        
        // tooltip
        this.controls.seekbar.slider.addEvent('move', function (e) {
            var step = e.locked ? e.step + e.offset : e.step;
                percent = step / e.limit * 100,
                time = percent / 100 * this.video.duration;
                
            e.content.set('text', Moovie.utilities.parse(time));
        }.bind(this));
        
        // The reason why I'm adding an event to each element, is that
        // using event delegation seems to fire the event twice.
        this.panels.settings.getChildren('p > input[type=checkbox]').addEvent('click', function (e) {
            var option = e.target.get('id').split('-')[1],
                value = !!e.target.get('checked');
            
            if (option === 'debug') {
                if (value) { this.enable(option); }
                else { this.disable(option); }
            }
            
            if ((this.options[option] === true || this.options[option] === false) && option !== 'debug') {
                this.options[option] = !!e.target.get('checked');
            } else if ((this[option] === true || this[option] === false) && option !== 'debug') {
                this[option] = !!e.target.get('checked');
            }
            
            this.panels.settings.toggle();  // close panel
        }.bind(this));
        
        this.panels.playlist.addEvent('click:relay(.checkbox-widget)', function (e) {
            var item = e.target.getParent('li');
            this.load(item.get('data-index'));
        }.bind(this));
    },
    
    enable: function (el) {
        this[el].attach();
        this.element.grab(this[el]);
    },
    
    disable: function (el) {
        this[el].detach();
        this.element.getFirst('.' + el).dispose();
    },
    
    request: function () {
        if (this.player.requestFullscreen) { this.player.requestFullscreen(); }
        else if (this.player.mozRequestFullScreen) { this.player.mozRequestFullScreen(); }
        else if (this.player.webkitRequestFullScreen) { this.player.webkitRequestFullScreen(); }
        else if (this.player.msRequestFullscreen) { this.player.msRequestFullscreen(); }
        this.fireEvent('fullscreenchange', { target: this.player });
        this.fullscreen = true;
    },
    
    // I hate using exitFullscreen(), cancelFullscreen sounds much nicer.
    cancel: function () {
        if (document.exitFullscreen) { document.exitFullscreen(); }
        else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
        else if (document.webkitCancelFullScreen) { document.webkitCancelFullScreen(); }
        else if (document.msExitFullscreen) { document.msExitFullscreen(); }
        this.fireEvent('fullscreenchange', { target: this.player });
        this.fullscreen = false;
    },
    
    lockStep: function (el, step, limit) {
        var percent = step / limit * 100;   // rename to step?
        limit = this.controls[el].slider.getLimit();
        step = limit / 100 * percent;
        this.controls[el].slider.toStep(step);
    },
    
    showCaptions: function (cue) {
        if (this.options.captions) {
            this.captions.setStyle('display', 'block');
            this.captions.caption.set('html', cue.text);
        }
    },
    
    hideCaptions: function (cue) {
        this.captions.setStyle('display', 'none');
        this.captions.caption.set('html', '');
    },
    
    load: function (id) {
        // Get current playlist item.
        id = this.options.playlist.valid(id)
           ? this.options.playlist.select(id).active()
           : this.options.playlist.active();
           
        if (id) {
            // Adds the 'active' class to panels playlist.
            this.panels.playlist.getElement('ol.playlist li.active').removeClass('active');
            this.panels.playlist.getElement('ol.playlist li[data-index=' + this.options.playlist.index + ']').addClass('active');
            
            this.panels.info.getElement('dt.title + dd').set('html', id.title);
            this.panels.info.getElement('dt.url + dd').set('html', id.src);
            
            // title should show on first play instead
            this.shownTitle = false;
            
            this.controls.seekbar.slider.reset();
            this.controls.volume.slider.reset();
            
            this.video.poster = id.poster;
            this.video.src = id.src;
            
            this.video.load();
            this.video.play();
        }
    },
    
    toggleMute: function (e) {
        this.video.muted = !this.video.muted;
    },
    
    toggleFullscreen: function () {
        if (this.fullscreen) { this.cancel(); } else { this.request(); }
    },
    
    togglePlayback: function () {
        if (this.video.paused || this.video.ended) {
            this.video.play();
        } else {
            this.video.pause();
        }
    },
    
    stop: function () {
        this.video.pause();
        this.video.currentTime = 0;
    },
    
    showTitle: function () {
        if (!this.shownTitle) {
            var title, timer;
            
            title = this.options.playlist.active().title;
            this.title.set('text', title);
            this.title.fade('in');
            
            timer = setTimeout(function () {
                this.title.fade('out');
                this.shownTitle = true;
                timer = null;
            }.bind(this), 6000);
        }
    },
    
    toElement: function () {
        return this.element;
    },
    
    /** PRIVATE METHODS */ 
    onClick: function () {
        this.togglePlayback();
    },
    
    onError: function () {   // is this error meant to be shown when cant fetch poster source?
        switch (this.video.error.code) {
            case this.video.error.MEDIA_ERR_ABORTED:
                console.log('You aborted the video playback.');
                break;
                
            case this.video.error.MEDIA_ERR_NETWORK:
                console.log('A network error caused the video download to fail part-way.');
                break;
                
            case this.video.error.MEDIA_ERR_DECODE:
                console.log('The video playback was aborted due to a corruption problem or because the video used features your browser did not support.');
                break;
                
            case this.video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                console.log('The video could not be loaded, either because the server or network failed or because the format is not supported.');
                break;
                
            default:
                console.log('An unknown error has occurred.');
                break;
        }
    },
    
    onProgress: function (e) {
        if (e.event.lengthComputable) {
            // Progress bar
           // var pct = e.event.loaded / e.event.total * 100;
            //this.controls.seekbar.overlay.setStyle('width', pct + '%');
            
            // Info panel
            //var mb = (e.event.total / 1024 / 1024).round(2);
            //this.panels.info.getElement('dt.size + dd').set('html', mb + ' MB');
        }
    },
    
    onLoadedMetaData: function () {
        this.element.setStyle('width', this.options.width || this.video.videoWidth);
        this.element.setStyle('height', this.options.height || this.video.videoHeight);
        this.controls.duration.set('text', Moovie.utilities.parse(this.video.duration));
    },
    
    onWaiting: function () {
        this.overlay.show('buffering');
    },
    
    onSeeked: function () {
        this.overlay.hide();  // substitute for 'playing' event.
    },
    
    onEnded: function () {
        if (this.loop) {
            this.togglePlayback();
        } else if (this.options.playlist.length > 1) {
            this.next();
        } else {
            this.controls.addClass('paused');
            this.overlay.show('replay');
            this.shownTitle = false;
        }
    },
    
    onDurationChange: function () {
        this.controls.duration.set('text', Moovie.utilities.parse(this.video.duration));
    },
        
    onTimeUpdate: function () {
        this.lockStep('seekbar', this.video.currentTime, this.video.duration);
        this.controls.elapsed.set('text', Moovie.utilities.parse(this.video.currentTime));
    },
    
    onPlay: function () {
        this.controls.play.removeClass('paused');
        this.controls.setStyle('display', 'block');
        this.showTitle();
    },
    
    onPause: function () {
        this.controls.play.addClass('paused');
        this.overlay.show('resume');
    },
    
    onVolumeChange: function () {
        var changed = !(this.muted === this.video.muted);
        this.muted = this.video.muted;
        
        // Un-mute if volume set to 0
        if (changed && !this.video.muted && this.video.volume === 0) {
            this.video.volume = .5;
            
        // Volume has been changed while muted.
        } else if (!changed && this.video.muted && this.video.volume !== 0) {
            this.video.muted = false;
            
        // Slider was dragged to 0
        } else if (!changed && !this.video.muted && this.video.volume === 0) {
            this.video.muted = true;
        }
        
        // set icon state
        if (this.video.muted) {
            this.controls.volume.mute.addClass('muted');
        } else {
            this.controls.volume.mute.removeClass('muted');
        }
        
        var volume = this.video.muted && changed ? 0 : this.video.volume;
        this.lockStep('volume', volume, 1);
    }
});

Moovie.Modules = {
    Debug: new Class({
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
                new Element('tfoot').grab(new Element('tr').grab(
                    this.elements.tfoot
                ))
            );
        },
        
        attach: function () {
            this.video.addEvents(this.bound);
        },
        
        detach: function () {
            this.video.removeEvents(this.bound);
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
    }), // Lines: 189
    
    Track: new Class({
        Implements: [Events],
        
        initialize: function (element, video) {
            // an object with properties matching the
            // track element can be passed in.
            this.element = element;
            this.video = document.id(video);
            this.parser = null;
            
            this.bound = {
                onTimeUpdate: this.onTimeUpdate.bind(this)
            };
            
            this.load();
            this.attach();
        },
        
        load: function () {
            var xmlhttp = new XMLHttpRequest();

            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                    this.parse(xmlhttp.responseText);
                    this.fireEvent('load', xmlhttp);
                } else {
                    this.fireEvent('error', xmlhttp);
                }
            }.bind(this);

            xmlhttp.open('GET', this.element.src, true);
            xmlhttp.send();
        },
        
        parse: function (data) {
            switch (this.element.kind) {
                case 'captions':
                case 'subtitles':
                    this.parser = new Moovie.Modules.Parsers.SRT(data);
                    this.cues = this.parser.cues;
                    break;
                    
                default:
                    throw new Error('The track kind or file type you selected is not supported');
            }
        },
        
        attach: function () {
            this.video.addEvent('timeupdate', this.bound.onTimeUpdate);
        },
        
        detach: function () {
            this.video.removeEvent('timeupdate', this.bound.onTimeUpdate);
        },
        
        onTimeUpdate: function () {
            var match = false;
        
            this.cues.forEach(function (cue, index) {
                if (this.video.currentTime >= cue.start && this.video.currentTime <= cue.end) {
                    match = true;
                    this.endEventFired = false;
                    this.fireEvent('enter', cue);
                }
                
                if (!match && !this.endEventFired) {
                    this.endEventFired = true;
                    this.fireEvent('end', cue);
                }
            }.bind(this));
        }
    }), // Lines: 72

    Parsers: {
        SRT: new Class({
            initialize: function (data) {
                this.parse(data);
            },
            
            parse: function (data) {
                this.cues = [];
                
                data = data.replace(/(?:\r\n|\r|\n)/gm, '\n');
                data = data.split('\n\n');
                
                data.forEach(function (cue) {
                    cue = cue.split('\n');
                    var id = cue.shift(),
                        time = cue.shift().split(/[\t ]*-->[\t ]*/),
                        text = cue.join('<br />');
                    
                    this.cues.push({
                        id: id,
                        start: this.toSeconds(time[0]),
                        end: this.toSeconds(time[1]),
                        text: text
                    });
                }.bind(this));
            },
            
            toSeconds: function (t) {
                t = t.split(/[:,]/);

                return parseFloat(t[0], 10) * 3600 +
                       parseFloat(t[1], 10) * 60 +
                       parseFloat(t[2], 10) +
                       parseFloat(t[3], 10) / 1000;
            }
        })
    },  // Lines: 37
    
    Playlist: new Class({
        Implements: Events,

        initialize: function (data) {
            this.data = JSON.parse(JSON.stringify(data));
            this.length = this.data.length;
            this.index = 0;
        },

        reset: function () {
            this.index = 0;
            return this;
        },

        hasPrevious: function () {
            return this.index > 0;
        },

        previous: function () {
            if (this.hasPrevious()) {
                this.index = this.index - 1;
                this.fireEvent('previous', this.active(), this.index);
            }
            return this;
        },

        select: function (key) {
            if (this.valid(key)) {
                this.index = key;
                this.fireEvent('select', this.active(), this.index);
            }
            return this;
        },

        next: function () {
            if (this.hasNext()) {
                this.index = this.index + 1;
                this.fireEvent('next', this.active(), this.index);
            }
            return this;
        },

        hasNext: function () {
            return this.index < this.length - 1;
        },

        active: function () {
            return this.data[this.index];
        },

        find: function (id) {
            return typeOf(id) === 'number' ? this.data[id] : this.data.indexOf(id);
        },

        valid: function (key) {
            return key >= 0 && key < this.length;
        },

        each: function (fn, context) {
            this.data.forEach(fn, context || this);
        },

        key: function () {
            return this.index;
        }
    }), // Lines: 66
};

Moovie.ui = {
    Overlay: new Class({
        Implements: Events,
        modals: [],
        
        initialize: function () {
            this.element = new Element('div.overlay');
            this.bound = { hide: this.hide.bind(this) };
        },
        
        add: function (key, modal, hideOnClick) {
            modal = document.id(modal).fade('hide');
            if (hideOnClick) { modal.addEvent('click', this.bound.hide); }
            this.modals.push({ key: key, modal: modal });
            this.element.grab(modal);
        },
        
        show: function (key) {
            if (key = this.get(key)) {
                key.fade('show');
                this.element.fade('show');
            }
        },
        
        hide: function () {
            this.element.fade('hide');
            this.modals.each(function (obj, i) {
                obj.modal.fade('hide');
            });
        },
        
        get: function (key, removeEvent) {
            key = this.exists(key);
            if (key && removeEvent) { key.removeEvent('click', this.bound.hide); }
            return key;
        },
        
        exists: function (key) {
            this.modals.some(function (obj, i) {
                if (obj.key === key) {
                    key = obj.modal; return;
                }
            });
            
            return key;
        },
        
        toElement: function () {
            return this.element;
        }
    }), // Lines: 50
    
    Slider: new Class({
        Implements: [Events, Options],
        
        options: {/*
            onStart: function (step) {},
            onDrag: function (obj) {},
            onStop: function (step) {},
            onStep: function (position) {},
            onMove: function (obj) {},*/
            disabled: false,
            reverse: false,
            mode: 'horizontal',
            tooltip: false,
            position: 'top',
            lock: true
        },
        
        initialize: function (options) {
            this.setOptions(options);
            
            this.dragging = false;
            this.bound = {
                start: this.start.bind(this),
                drag: this.drag.bind(this),
                stop: this.stop.bind(this),
                move: this.move.bind(this),
                hide: this.hide.bind(this)
            };
            
            this.build();
            this.setup();
        },
        
        build: function () {
            // build slider
            this.elements = {
                slider: new Element('div.slider.' + this.options.mode),
                track: new Element('div.track'),
                overlay: new Element('div.overlay'),
                bar: new Element('div.bar'),
                knob: new Element('div.knob')
            };
            
            this.elements.track.adopt(
                this.elements.overlay,
                this.elements.bar,
                this.elements.knob
            );
            
            this.elements.slider.grab(
                this.elements.track
            );
            
            // build tooltip
            if (this.options.tooltip) {
                Object.append(this.elements, {
                    tooltip: new Element('div.tooltip.' + this.options.position),
                    content: new Element('div.content'),
                    arrow: new Element('div.arrow')
                });
                
                this.elements.tooltip.adopt(
                    this.elements.content,
                    this.elements.arrow
                );
                
                this.elements.slider.grab(
                    this.elements.tooltip
                );
            }
        },
        
        setup: function () {
            // some helper properties
            this.axis       = this.options.mode === 'vertical' ? 'y' : 'x';
            this.dimension  = this.options.mode === 'vertical' ? 'height' : 'width';
            this.mouse      = { pos: 0, min: 0, max: 0 };
            
            // define reference point for axis.
            this.modifier = {
                x: this.options.reverse ? 'right' : 'left',
                y: this.options.reverse ? 'bottom' : 'top'
            };
            
            // set the knob's default position, usually 0
            if (isNaN(this.getPosition('knob'))) { this.setPosition('knob', 0); }
            if (isNaN(this.getPosition('knob'))) { this.setPosition('knob', 0); }
            
            // call addition methods if needed
            if (this.options.reverse) { this.reverse(); }
            if (!this.options.disabled) { this.attach(); }
        },
        
        attach: function () {
            this.elements.knob.addEvent('mousedown', this.bound.start);
            
            if (this.options.tooltip) {
                this.elements.track.addEvent('mousemove', this.bound.move);
                this.elements.track.addEvent('mouseleave', this.bound.hide);
            }
        },
        
        detach: function () {
            this.elements.knob.removeEvent('mousedown', this.bound.start);
            
            if (this.options.tooltip) {
                this.elements.track.removeEvent('mousemove', this.bound.move);
                this.elements.track.removeEvent('mouseleave', this.bound.hide);
            }
        },
        
        start: function (e) {
            if (e.rightClick) { return; }
            e.stop();
            
            var step = this.getPosition('knob'),    // knob position
                limit = this.getLimit(),
                pos = e.client[this.axis];    // mouse position
            
            // Were "officially" dragging now.
            this.mouse.pos = pos;
            this.dragging = true;
            
            // Find the min and max mouse positions.
            if (this.options.reverse) {
                this.mouse.max = -0 + pos + step;
                this.mouse.min = -limit + pos + step;
            } else{
                this.mouse.min = pos - step + 0;
                this.mouse.max = this.mouse.min + limit - 0;
            }

            document.addEvent('mousemove', this.bound.drag);
            document.addEvent('mouseup', this.bound.stop);
            
            this.fireEvent('start', step);
            return false;
        },
        
        drag: function (e) {
            if (e.rightClick) { return; }
            e.stop();
            
            var step = this.getPosition('knob'),    // knob position
                pos = e.client[this.axis],    // mouse position
                to;
            
            // Limit knob movement / find new position.
            pos = pos.limit(this.mouse.min, this.mouse.max);
            to = step + ((pos - this.mouse.pos) * (this.options.reverse ? -1 : 1));

            // Move element / store current position.
            this.setDimension('bar', to);
            this.setPosition('knob', to);
            this.mouse.pos = pos;
            
            // fire event
            this.fireEvent('drag', { step: step, limit: this.getLimit() });
            return false;
        },
        
        stop: function (e) {
            document.removeEvent('mousemove', this.bound.drag);
            document.removeEvent('mouseup', this.bound.end);
            
            this.dragging = false;
            this.fireEvent('stop', this.getPosition('knob'));
        },
        
        move: function (e) {
            this.show();
            
            if (this.options.lock && e.target.hasClass('knob')) {
                var locked = true,
                    track = this.elements.track,
                    knob = this.elements.knob,
                    position = this.getPosition('track', true),
                    offset = knob.getSize()[this.axis] / 2,
                    step = this.getPosition('knob', true) - position;
            } else {
                var locked = false,
                    track = this.elements.track,
                    position = this.getPosition('track', true),
                    offset = this.elements.content.getSize()[this.axis] / 2,
                    step = e.client[this.axis] - position;
            }
            
            this.setPosition('tooltip', step - offset);
            this.fireEvent('move', {
                step: step,
                limit: this.getLimit(),
                offset: offset,
                content: this.elements.content,
                target: this.elements.tooltip,
                locked: locked
            });
        },
        
        show: function () {
            this.elements.tooltip.fade('show');
        },
        
        hide: function () {
            this.elements.tooltip.fade('hide');
        },
        
        reset: function () {
            this.setDimension('bar', 0);
            this.setPosition('knob', 0);
        },
        
        reverse: function () {
            var knob = this.elements.knob,
                style = 'margin-' + this.modifier[this.axis];
                
            switch (style) {
                case 'margin-right':
                    knob.setStyle(style, knob.getStyle('margin-left'))
                        .setStyle('margin-left', 'auto');
                    break;
                    
                case 'margin-bottom':
                    knob.setStyle(style, knob.getStyle('margin-top'))
                        .setStyle('margin-top', 'auto');
                    break;
            }
        },
        
        getLimit: function () {
            return this.elements.track.getSize()[this.axis];
        },
        
        toStep: function (step) {
            if (!this.dragging) {
                step = step.limit(0, this.getLimit());
                this.setDimension('bar', step);
                this.setPosition('knob', step);
                this.fireEvent('step', step);
            }
        },
        
        setDimension: function (el, val) {
            this.elements[el].style[this.dimension] = val + 'px';
        },
        
        setPosition: function (el, val) {
            this.elements[el].style[this.modifier[this.axis]] = val + 'px';
        },
        
        getPosition: function (el, builtIn) {
            if (builtIn)
                return this.elements[el].getPosition()[this.axis];
            else
                return parseInt(this.elements[el].style[this.modifier[this.axis]]);
        },
        
        toElement: function () {
            return this.elements.slider;
        }
    })  // Lines: 260
};

Moovie.utilities = {
    parse: function (v) {
        v = parseInt(v);
        
        var h = Math.floor(v / 3600),
            m = Math.floor(v % 3600 / 60),
            s = Math.floor(v % 3600 % 60);
        
        return (
            (h > 0 ? h + ':' : '') +
            (m > 0 ? (h > 0 && m < 10 ? '0' : '') + m + ':' : '0:') +
            (s < 10 ? '0' : '') + s
        );
    },
    
    aspectRatio: function (y, x) {
        var gcd = Moovie.utilities.gcd(y, x);
        return (y / gcd) + ':' + (x / gcd);
    },
    
    basename: function (path) {
        return path.replace(/\\/g, '/').replace(/.*\//, '');
    },
    
    gcd: function (a, b) {
        return (b == 0) ? a : Moovie.gcd(b, a%b);
    }
};

Element.implement({
    Moovie: function (options) {
        var instance = new Moovie(this, options);
        this.store('Moovie', instance);
        return instance;
    }
}); // Lines: 1533