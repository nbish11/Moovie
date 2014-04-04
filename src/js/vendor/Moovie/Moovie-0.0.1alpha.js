/**
 * Moovie - version 0.0.1 alpha - 02/04/2014
 *
 * Moovie: An HTML5 <video> custom controls library
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

var Moovie = function (videos, options) {

    options = options || {};

    // ================================================================================
    // The main function, which handles one <video> at a time.
    // <http://www.urbandictionary.com/define.php?term=Doit&defid=3379319>
    var Doit = function (video, options) {

        video.controls = false;
        
        // It seems pointless to use the URI class when it can so easily be done 
        // with a simple regex. Same implementation as PHP's basename() function.
        var basename = function (path) {
            return path.replace(/\\/g, '/').replace(/.*\//, '');
        };

        // Options
        var defaults = {
            debug: false,
            autohideControls: true,
            title: basename(video.src),
            playlist: [],
            captions: null,
            showCaptions: true,
            captionLang: 'en'
        };

        options = $merge(defaults, options);

        // Add the current video to the playlist stack
        options.playlist.unshift({
            id: options.id,
            src: video.src,
            title: options.title
        });
        
        // Encode/decode as JSON string, now wrap in an iterator for
        // playlist management.
        options.playlist = JSON.parse(JSON.stringify(options.playlist))
        options.playlist = new Moovie.Modules.Iterator(options.playlist);

        // Grab some refs
        var wrapper = video.getParent();
        var container = wrapper.getParent();

        // Add HTML 5 media events to Element.NativeEvents, if needed.
        if (!Element.NativeEvents.timeupdate) {
            Element.NativeEvents = $merge({
                abort: 1,
                canplay: 1,
                canplaythrough: 1,
                durationchange: 1,
                emptied: 1,
                ended: 1,
                loadeddata: 1,
                loadedmetadata: 1,
                loadstart: 1,
                pause: 1,
                play: 1,
                playing: 1,
                progress: 2,
                ratechange: 1,
                seeked: 1,
                seeking: 1,
                stalled: 1,
                suspend: 1,
                timeupdate: 1,
                volumechange: 1,
                waiting: 1
            }, Element.NativeEvents);
        }

        // Unfortunately, the media API only defines one volume-related event: 
        // `volumechange`. This event is fired whenever the media's `volume`
        // attribute changes, or the media's `muted` attribute changes. The API
        // defines no way to discern the two, so we'll have to "manually" keep 
        // track. We need to do this in order to be able to provide the advanced 
        // volume control (a la YouTube's player): changing the volume can have 
        // an effect on the muted state and vice versa.
        var muted = video.muted;


        // Utility methods ---------------------------------------------------------

        // Parses a float value in seconds (from video.currentTime etc) to normal time format
        var parseTime = function (val) {
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

            if (secs.length == 1) {
                secs = '0' + secs;
            }
            if (hrs !== 0) time += hrs + ':';
            return time + mins + ':' + secs;
        };

        // Calculates offset for progress bar slider based on page location
        var locToTime = function (val) {
            var barX = controls.progress.bar.getPosition().x;
            var barW = controls.progress.bar.getSize().x;
            var offsetPx = val - barX;
            var offsetPc = offsetPx / barW * 100;
            var time = (video.duration || 0) / 100 * offsetPc;
            return time;
        };

        // Calculates offset for volume bar slider based on page location
        var locToVolume = function (val) {
            var barY = controls.volume.bar.getPosition().y;
            var barH = controls.volume.bar.getSize().y;
            var offsetPx = val - barY;
            var offsetPc = offsetPx / barH * 100;
            var volume = 1 - (1 / 100 * offsetPc).limit(0, 1);
            return volume;
        };

        // Dubug mode ==============================================================
        if (options.debug) {
            var debug = $(new Moovie.Modules.Debug(video));
            debug.inject(container);
        }

        // Build interface =========================================================

        // Captions ----------------------------------------------------------------
        var captions        = new Element('div.captions');
        captions.caption    = new Element('p');
        
        captions.grab(captions.caption);
        captions.setStyle('display', 'none');

        // Overlay -----------------------------------------------------------------
        var overlay         = new Element('div.overlay');
        overlay.wrapper     = new Element('div.wrapper');
        overlay.buffering   = new Element('div.buffering', { "text": 'Buffering...' });
        overlay.play        = new Element('div.play', { "text": 'Play video' });
        overlay.replay      = new Element('div.replay', { "text": 'Replay' });
        overlay.paused      = new Element('div.paused', { "text": 'Paused' });

        overlay.wrapper.adopt(overlay.buffering, overlay.play, overlay.replay, overlay.paused);
        overlay.grab(overlay.wrapper);
        overlay.set('tween', { "duration": 50 });
        overlay.fade('hide');

        // Title -------------------------------------------------------------------
        var title = new Element('div.video-title', { "html": options.title });
        
        title.set('tween', { "duration": 2000 });
        title.fade('hide');

        // Panels ------------------------------------------------------------------
        var panels          = new Element('div.panels');
        panels.info         = new Element('div.info');
        panels.settings     = new Element('div.settings');
        panels.about        = new Element('div.about');
        panels.playlist     = new Element('div.playlist');

        panels.adopt(panels.info, panels.settings, panels.about, panels.playlist);
        panels.set('tween', { "duration": 250 });
        panels.fade('hide');

        // Content for `info` panel
        panels.info.set('html', '\
            <div class="heading">Video information</div>\
            \
            <dl>\
                <dt class="title">Title</dt>\
                <dd>' + options.title + '</dd>\
                <dt class="url">URL</dt>\
                <dd>' + video.src + '</dd>\
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
            <div class="checkbox-widget" data-control="loop" data-checked="' + (video.loop || false) + '">\
                <div class="checkbox"></div>\
                <div class="label">Loop video</div>\
            </div>\
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
            <p>Copyright Â© 2010, Colin Aarts</p>\
            <p><a href="http://colinaarts.com/code/moovie/" rel="external">http://colinaarts.com/code/moovie/</a></p>\
        ');

        // Wrapper content for `playlist` panel
        panels.playlist.set('html', '\
            <div><div class="heading">Playlist</div></div>\
            \
            <div><ol class="playlist"></ol></div>\
        ');
        
        options.playlist.each(function (item, index) {
            panels.playlist.getElement('ol.playlist').grab(new Element('li', {
                "data-index": index,
                "class": (index === 0 ? 'active' : ''),
                "html": '\
                    <div class="checkbox-widget" data-checked="true">\
                        <div class="checkbox"></div>\
                        <div class="label">' + item.title + '</div>\
                    </div>\
                '
            }));
        });

        // Controls ----------------------------------------------------------------
        var controls        = new Element('div.controls');
        controls.wrapper    = new Element('div.wrapper');

        // General
        controls.play           = new Element('div.play', { "title": '' });
        controls.stop           = new Element('div.stop', { "title": 'Stop' });
        controls.currentTime    = new Element('div.current-time', { "text": '0.00' });
        controls.duration       = new Element('div.duration', { "text": '0.00' });
        controls.settings       = new Element('div.settings', { "title": 'Settings' });
        controls.close          = new Element('div.close', { "title": 'Close panel' });
        controls.previous       = options.playlist.length() > 1 ? new Element('div.previous', { "title": 'Previous' }) : null;
        controls.next           = options.playlist.length() > 1 ? new Element('div.next', { "title": 'Next' }) : null;

        // Progress
        controls.progress           = new Element('div.progress');
        controls.progress.wrapper   = new Element('div.wrapper');
        controls.progress.bar       = new Element('div.bar');
        controls.progress.time      = new Element('div.time').grab(new Element('div', { "text": '0.00' }));
        controls.progress.buffered  = new Element('div.buffered');
        controls.progress.played    = new Element('div.played');
        controls.progress.slider    = new Element('div.slider');

        controls.progress.wrapper.adopt(
            controls.progress.bar,
            controls.progress.buffered,
            controls.progress.played,
            controls.progress.slider,
            controls.progress.time
        );
        
        controls.progress.grab(controls.progress.wrapper);
        controls.progress.time.fade('hide');

        // Volume
        controls.volume         = new Element('div.volume');
        controls.volume.mute    = new Element('div.mute');
        controls.volume.wrapper = new Element('div.wrapper');
        controls.volume.popup   = new Element('div.popup');
        controls.volume.bar     = new Element('div.bar');
        controls.volume.slider  = new Element('div.slider');

        controls.volume.popup.adopt(controls.volume.bar, controls.volume.slider);
        controls.volume.wrapper.adopt(controls.volume.mute, controls.volume.popup);
        controls.volume.grab(controls.volume.wrapper);
        controls.volume.popup.fade('hide');
        controls.volume.popup.set('tween', { "duration": 150 });

        // More
        controls.more           = new Element('div.more');
        controls.more.wrapper   = new Element('div.wrapper');
        controls.more.popup     = new Element('div.popup');
        controls.more.about     = new Element('div.about', { "title": 'About' });
        controls.more.info      = new Element('div.info', { "title": 'Video info' });
        controls.more.playlist  = new Element('div.playlist', { "title": 'Playlist' });

        controls.more.popup.adopt(controls.more.about, controls.more.info, controls.more.playlist);
        controls.more.wrapper.grab(controls.more.popup);
        controls.more.grab(controls.more.wrapper);
        controls.more.popup.fade('hide');
        controls.more.popup.set('tween', { "duration": 150 });

        // Controls build
        controls.wrapper.adopt(
            controls.play,
            controls.stop,
            controls.previous,
            controls.next,
            controls.currentTime,
            controls.progress,
            controls.duration,
            controls.volume,
            controls.settings,
            controls.more,
            controls.close
        );
        
        controls.grab(controls.wrapper);
        controls.set('tween', { "duration": 300 }); // 150 was to fast for my liking

        // Inject and do some post-processing --------------------------------------
        wrapper.adopt(captions, overlay, title, panels, controls);

        // Get the knob offsets for later
        controls.progress.slider.left   = controls.progress.slider.getStyle('left').toInt();
        controls.volume.slider.top      = controls.volume.slider.getStyle('top').toInt();

        // Adjust height of panel container to account for controls bar
        panels.setStyle('height', panels.getStyle('height').toInt() - controls.getStyle('height').toInt());

        // Err. Fixed height for the playlist.
        (function () {
            var el = panels.playlist.getChildren('div:nth-child(2)')[0],
                height = 0;
            var content = el.getChildren().clone();
            el.empty();
            height = el.getStyle('height');
            el.adopt(content);
            el.getFirst().setStyle('height', height);
            $$(panels.playlist, panels.playlist.getChildren()).setStyle('display', 'block');
            // Holy crap, that is ugly. One day, CSS will actually be able to lay out inferfaces. Or maybe not.
        })();

        // Make sliders draggable
        $$(controls.progress.slider, controls.volume.slider).each(function (el) {
            var modifiers = el.getParents('.progress').length ? { "y": false } : { "x": false };
            var onDrag = el.getParents('.progress').length ? function (el, e) {
                    var barX = controls.progress.bar.getPosition().x;
                    var barW = controls.progress.bar.getSize().x;
                    
                    if (e.page.x < barX) {
                        el.setStyle('left', el.left);
                    } else if (e.page.x > barX + barW) {
                        el.setStyle('left', el.left + barW);
                    }
                    
                    controls.progress.time.update(true, e.page.x);
                } : function (el, e) {
                    video.volume = locToVolume(e.page.y);
                    
                    var barY = controls.volume.bar.getPosition().y;
                    var barH = controls.volume.bar.getSize().y;
                    
                    if (e.page.y < barY) {
                        el.setStyle('top', el.top);
                    } else if (e.page.y > barY + barH) {
                        el.setStyle('top', el.top + barH);
                    }
                };
                
            var onComplete = el.getParents('.progress').length ? function (el, e) {
                    el.beingDragged = false;
                    video.currentTime = locToTime(e.page.x);
                    
                    if (video.paused) {
                        video.play();
                    }
                    
                } : function (el, e) {
                    el.beingDragged = false;
                };

            el.drag = new Drag(el, {
                modifiers: modifiers,
                snap: 0,
                onStart: function () {
                    el.beingDragged = true;
                },
                onDrag: onDrag,
                onComplete: onComplete,
                onCancel: function () {
                    el.beingDragged = true;
                }
            });

        }); // end each() for draggable sliders


        // Methods =================================================================

        // Overlay -----------------------------------------------------------------
        overlay.update = function (which) {
            if (which == 'none') {
                this.fade('out');
            } else {
                this.wrapper.getChildren().setStyle('display', 'none');
                this[which].setStyle('display', 'block');
                this.fade('in');
            }
        };

        // Title -------------------------------------------------------------------
        title.showTitle = function () {
            var index = options.playlist.key();
            var text = options.playlist.getActive().title;
            title.set('html', index.toString() + '. ' + text);
            title.fade('in');
            var timer = setTimeout(function () {
                title.fade('out');
                timer = null;
            }, 6000);
        };

        // Panels ------------------------------------------------------------------
        panels.update = function (which) {
            if (which == 'none' || this[which].hasClass('active')) {
                this.getChildren('.active').removeClass('active');
                this.fade('out');
            } else {
                this.getChildren().setStyle('display', 'none').removeClass('active');;
                this[which].setStyle('display', 'block').addClass('active');
                this.fade('in');
            }
        };
        
        panels.playlist.play = function (action) {
            var item;
            
            switch (action) {
                case 'previous':
                    item = options.playlist.previous();
                    break;
                    
                case 'next':
                    item = options.playlist.next();
                    break;
                    
                default:
                    item = options.playlist.setCurrent(action);
            }
            
            if (item) {
                panels.playlist.getElement('ol.playlist li.active').removeClass('active');
                panels.playlist.getElement('ol.playlist li[data-index="' + (options.playlist.key()) + '"]').addClass('active');

                video.src = item.src;
                video.load();
                video.play();

                options.captions = Moovie.captions[item.id];

                title.showTitle();

                panels.info.getElement('dt.title + dd').set('html', (item.title || basename(item.src)));
                panels.info.getElement('dt.url + dd').set('html', item.src);
            }
        }

        // Controls ----------------------------------------------------------------
        controls.play.update = function (action) {
            if (video.paused || video.ended) {
                this.removeClass('paused');
            } else {
                this.addClass('paused');
            }
        };

        controls.progress.update = function (action) {
            if (!controls.progress.slider.beingDragged) {
                var el = controls.progress.slider;
                var pct = video.currentTime / video.duration * 100;
                var width = controls.progress.bar.getSize().x;
                var offset = (width / 100) * pct;
                el.setStyle('left', offset + el.left + 'px');
            }
        };

        controls.progress.time.update = function (offset, slider) {
            controls.progress.time.fade('show');
            var barX = controls.progress.bar.getPosition().x;
            if (!slider) {
                controls.progress.time.setStyle('left', offset - barX + 'px');
            } else {
                var sliderX = controls.progress.slider.getPosition().x;
                controls.progress.time.setStyle('left', sliderX - barX - controls.progress.slider.left + 'px');
                offset = sliderX - controls.progress.slider.left;
            }
            this.getFirst().set('text', parseTime(locToTime(offset)));
        };

        controls.volume.update = function (action) {
            var mutedChanged = !(muted == video.muted);
            muted = video.muted;

            if (mutedChanged && !video.muted && video.volume === 0) {
                // Un-muted with volume at 0 -- pick a sane default. This is probably the only deviation from the way the YouTube flash player handles volume control.
                video.volume = .5;
            } else if (video.muted && video.volume !== 0 && !mutedChanged) {
                // Volume changed while muted -> un-mute
                video.muted = false;
            } else if (!mutedChanged && !video.muted && video.volume === 0) {
                // Slider dragged to 0 -> mute
                video.muted = true;
            }

            if (video.muted) {
                controls.volume.mute.addClass('muted');
            } else {
                controls.volume.mute.removeClass('muted');
            }

            if (!controls.volume.slider.beingDragged) {
                var slider = controls.volume.slider;
                var volume = video.muted && mutedChanged ? 0 : video.volume; // If muted, assume 0 for volume to visualize the muted state in the slider as well. Don't actually change the volume, though, so when un-muted, the slider simply goes back to its former value.
                var barSize = controls.volume.bar.getSize().y;
                var offset = barSize - volume * barSize;
                slider.setStyle('top', offset + slider.top);
            }
        }; // end controls.volume.update()

        controls.currentTime.update = controls.duration.update = function (time) {
            this.set('text', parseTime(time));
        };


        // Events ==================================================================

        // Masthead ----------------------------------------------------------------
        wrapper.addEvent('mouseenter', function (e) {
            controls.fade('in');
        });

        wrapper.addEvent('mouseleave', function (e) {
            if (options.autohideControls) {
                controls.fade('out');
            }
        });

        // Overlay -----------------------------------------------------------------
        $$(overlay.play, overlay.replay).addEvent('click', function (e) {
            video.play();
            title.showTitle();
        });

        $$(overlay.paused).addEvent('click', function (e) {
            video.play();
        });

        // Panels ------------------------------------------------------------------

        // Checkbox widgets
        panels.addEvent('click:relay(.checkbox-widget)', function (e) {
            if (this.get('data-checked') == 'false') {
                this.set('data-checked', 'true');
            } else {
                this.set('data-checked', 'false');
            }

            var control = this.get('data-control');
            var checked = this.get('data-checked');

            switch (control) {
            case 'autohideControls':
                options.autohideControls = checked == 'true';
                break;

            case 'loop':
                video.loop = checked == 'true';
                break;

            case 'showCaptions':
                options.showCaptions = checked == 'true';
                break;
            }
        });

        panels.playlist.addEvent('click:relay(.label)', function (e) {
            e.stop();

            var item = this.getParents('li')[0];
            var index = +item.get('data-index');
            panels.playlist.play(index);
        });

        // Controls ----------------------------------------------------------------

        // Playback
        controls.play.addEvent('click', function (e) {
            if (video.paused && video.readyState >= 3) {
                video.play();
            } else if (!video.paused && video.ended) {
                video.currentTime = 0;
            } else if (!video.paused) {
                video.pause();
            }
        });

        controls.stop.addEvent('click', function (e) {
            video.currentTime = 0;
            video.pause();
        });

        if (options.playlist.length() > 1) {
            controls.previous.addEvent('click', function (e) {
                panels.playlist.play('previous');
            });

            controls.next.addEvent('click', function (e) {
                panels.playlist.play('next');
            });
        }

        // Progress
        controls.progress.bar.addEvent('click', function (e) {
            video.currentTime = locToTime(e.page.x);
            if (video.paused) {
                video.play();
            }
        });

        controls.progress.bar.addEvent('mousemove', function (e) {
            controls.progress.time.update(e.page.x, false);
        });

        controls.progress.slider.addEvent('mouseenter', function (e) {
            controls.progress.time.update(e.page.x, true);
        });

        controls.progress.bar.addEvent('mouseleave', function (e) {
            controls.progress.time.fade('hide');
        });

        controls.progress.slider.addEvent('mouseleave', function (e) {
            controls.progress.time.fade('hide');
        });

        // Volume
        controls.volume.mute.addEvent('click', function (e) {
            if (video.muted) {
                video.muted = false;
            } else {
                video.muted = true;
            }
        });

        controls.volume.addEvent('mouseenter', function (e) {
            controls.volume.popup.fade('in');
        });

        controls.volume.addEvent('mouseleave', function (e) {
            controls.volume.popup.fade('out');
        });

        controls.volume.bar.addEvent('click', function (e) {
            video.volume = locToVolume(e.page.y);
        });

        // "more"
        controls.more.addEvent('mouseenter', function (e) {
            controls.more.popup.fade('in');
        });

        controls.more.addEvent('mouseleave', function (e) {
            controls.more.popup.fade('out');
        });

        controls.more.about.addEvent('click', function (e) {
            panels.update('about');
        });

        controls.more.info.addEvent('click', function (e) {
            panels.update('info');
        });

        controls.more.playlist.addEvent('click', function (e) {
            panels.update('playlist');
        });

        // Misc
        controls.settings.addEvent('click', function (e) {
            panels.update('settings');
        });

        controls.close.addEvent('click', function (e) {
            panels.update('none');
        });


        // Video element -----------------------------------------------------------
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
                if (options.playlist.length > 1) {
                    options.playlist.play('next');
                } else {
                    controls.play.update();
                    overlay.update('replay');
                }
            },

            progress: function (e) {
                if (e.event.lengthComputable) {
                    // Progress bar
                    var pct = e.event.loaded / e.event.total * 100;
                    controls.progress.buffered.setStyle('width', pct + '%');
                    // Info panel
                    var MB = (e.event.total / 1024 / 1024).round(2);
                    panels.info.getElement('dt.size + dd').set('html', MB + ' MB');
                }
            },

            seeking: function (e) {
                overlay.update('buffering');
            },

            seeked: function (e) {
                overlay.update('none');
                if (!video.paused) {
                    controls.play.update();
                }
            },

            timeupdate: function (e) {
                controls.currentTime.update(video.currentTime);
                controls.progress.update();

                // Captions
                var found = false;

                if (options.captions && options.showCaptions) {
                    options.captions[options.captionLang].each(function (caption) {
                        if (video.currentTime >= caption.start / 1000 && video.currentTime <= caption
                            .end / 1000) {
                            captions.caption.set('html', caption.text);
                            captions.setStyle('display', 'block');
                            found = true;
                        }
                    });
                }

                if (!found) {
                    captions.caption.set('html', '');
                    captions.setStyle('display', 'none');
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
        }); // end events for video element


        // Init ====================================================================
        container.addClass('Moovie');

        if (!video.autoplay) {
            overlay.update('play');
        }

        var tips = new Tips(wrapper.getElements('[title]'), {
            className: 'video-tip',
            title: '',
            text: function (el) {
                return el.get('title');
            }
        });
    }; // end Doit()

    // Init ======================================================================
    videos.each(function (el) {
        if ($type(el) == 'element') {
            el.Moovie = new Doit(el, options);
        } else if ($type(el) == 'object') {
            el.options = el.options || {};
            el.options.id = el.id || null;
            el.options.captions = Moovie.captions[el.id] || null;
            el.video.Moovie = new Doit(el.video, $merge(options, el.options));
        }
    });
}; // end Moovie()

// Public static properties
Moovie.captions = {};
Moovie.languages = { // You can add additional language definitions here
    'en': 'English'
};

// Public static methods
Moovie.registerCaptions = function (id, captions) {
    this.captions[id] = captions;
};

Moovie.Modules = {
    Debug: new Class({
        initialize: function (video) {
            this.video = document.id(video);
            
            this.build();
            this.attach();
        },
        
        build: function () {
            this.element            = new Element('div.debug');
            this.element.table      = new Element('table');
            this.element.table.body = new Element('tbody');
            this.element.msg        = new Element('p', { "text": 'Moovie instance ready.' });

            [
                'autobuffer',
                'autoplay',
                'controls',
                'loop',
                'networkState',
                'readyState',
                'error',
                //'buffered',
                'defaultPlaybackRate',
                'playbackRate',
                'duration',
                'currentTime',
                'startTime',
                //'played',
                //'seekable',
                'seeking',
                'paused',
                'ended',
                'volume',
                'muted'
            ].each(function (el) {
                var row = new Element('tr'),
                    label = new Element('td', { "text": el });
                
                this.element[el] = new Element('td', { "text": this.video[el] });
                row.adopt(label, this.element[el]);
                this.element.table.body.grab(row);
            }.bind(this));

            this.element.table.grab(this.element.table.body);
            this.element.adopt(this.element.table, this.element.msg);
        },
        
        attach: function () {
            this.video.addEvents({
                // networkState
                loadstart: function (e) {
                    this.element.networkState.set('text', this.video.networkState);
                    this.element.networkState.getParent().highlight();

                    this.element.msg.set('html', 'Now looking for data...');
                    this.element.msg.highlight();
                }.bind(this),

                progress: function (e) {
                    this.element.networkState.set('text', this.video.networkState);
                    this.element.networkState.getParent().highlight();

                    this.element.msg.set('html', 'Now fetching data...');
                    this.element.msg.highlight();
                }.bind(this),

                suspend: function (e) {
                    this.element.networkState.set('text', this.video.networkState);
                    this.element.networkState.getParent().highlight();

                    this.element.msg.set('html', 'Data fetching <b>suspended</b>.');
                    this.element.msg.highlight();
                }.bind(this),

                abort: function (e) {
                    this.element.networkState.set('text', this.video.networkState);
                    this.element.networkState.getParent().highlight();

                    this.element.msg.set('html', 'Data fetching <b>aborted</b>.');
                    this.element.msg.highlight();
                }.bind(this),

                error: function (e) {
                    this.element.networkState.set('text', this.video.networkState);
                    this.element.networkState.getParent().highlight();

                    this.element.error.set('text', this.video.error.code);
                    this.element.error.highlight();

                    this.element.msg.set('html', 'An error occurred while fetching data. See <b>error</b> attribute.');
                    this.element.msg.highlight();
                }.bind(this),

                emptied: function (e) {
                    this.element.networkState.set('text', this.video.networkState);
                    this.element.networkState.getParent().highlight();

                    this.element.msg.set('html', 'Media resource <b>emptied</b>. Possible error; see <b>error attribute.');
                    this.element.msg.highlight();
                }.bind(this),

                stalled: function (e) {
                    this.element.networkState.set('text', this.video.networkState);
                    this.element.networkState.getParent().highlight();

                    this.element.msg.set('html', 'Data throughput is <b>stalled</b>, possibly temporarily.');
                    this.element.msg.highlight();
                }.bind(this),

                // readyState
                loadedmetadata: function (e) {
                    this.element.readyState.set('text', this.video.readyState);
                    this.element.readyState.getParent().highlight();

                    this.element.msg.set('html', 'Duration and dimensions of media resource determined.');
                    this.element.msg.highlight();
                }.bind(this),

                loadeddata: function (e) {
                    this.element.readyState.set('text', this.video.readyState);
                    this.element.readyState.getParent().highlight();

                    this.element.msg.set('html', 'Some data available, but more is needed.');
                    this.element.msg.highlight();
                }.bind(this),

                waiting: function (e) {
                    this.element.readyState.set('text', this.video.readyState);
                    this.element.readyState.getParent().highlight();

                    this.element.msg.set('html', '<b>Waiting</b> for more data...');
                    this.element.msg.highlight();
                }.bind(this),

                playing: function (e) {
                    this.element.readyState.set('text', this.video.readyState);
                    this.element.readyState.getParent().highlight();

                    this.element.msg.set('html', 'Playback has started.');
                    this.element.msg.highlight();
                }.bind(this),

                canplay: function (e) {
                    this.element.readyState.set('text', this.video.readyState);
                    this.element.readyState.getParent().highlight();

                    this.element.msg.set('html', 'Playback possible, but will likely be interrupted for buffering before reaching the end.');
                    this.element.msg.highlight();
                }.bind(this),

                canplaythrough: function (e) {
                    this.element.readyState.set('text', this.video.readyState);
                    this.element.readyState.getParent().highlight();

                    this.element.msg.set('html', 'Most likely, uninterrupted playback all the way through to the end is now possible.');
                    this.element.msg.highlight();
                }.bind(this),

                // Playback
                play: function (e) {
                    this.element.paused.set('text', this.video.paused);
                    this.element.paused.getParent().highlight();

                    this.element.ended.set('text', this.video.ended);
                    this.element.ended.getParent().highlight();
                }.bind(this),

                pause: function (e) {
                    this.element.paused.set('text', this.video.paused);
                    this.element.paused.getParent().highlight();
                }.bind(this),

                ended: function (e) {
                    this.element.ended.set('text', this.video.ended);
                    this.element.ended.getParent().highlight();
                }.bind(this),

                timeupdate: function (e) {
                    this.element.currentTime.set('text', this.video.currentTime.round(3));
                    this.element.currentTime.getParent().highlight();
                }.bind(this),

                seeking: function (e) {
                    this.element.seeking.set('text', this.video.seeking);
                    this.element.seeking.getParent().highlight();
                }.bind(this),

                seeked: function (e) {
                    this.element.seeking.set('text', this.video.seeking);
                    this.element.seeking.getParent().highlight();
                }.bind(this),

                // Misc
                durationchange: function (e) {
                    this.element.duration.set('text', this.video.duration.round(3));
                    this.element.duration.getParent().highlight();
                }.bind(this),

                ratechange: function (e) {
                    this.element.playbackRate.set('text', this.video.playbackRate);
                    this.element.playbackRate.getParent().highlight();

                    this.element.defaultPlaybackRate.set('text', this.video.defaultPlaybackRate);
                    this.element.defaultPlaybackRate.getParent().highlight();
                }.bind(this),

                volumechange: function (e) {
                    this.element.muted.set('text', this.video.muted);
                    this.element.muted.getParent().highlight();

                    this.element.volume.set('text', this.video.volume.round(3));
                    this.element.volume.getParent().highlight();
                }.bind(this)
            });
        },
        
        toElement: function () {
            return this.element;
        }
    }),
    
    Slider: new Class({
        Extends: Drag,
        
        options: {
            axis: 'x',
            reverse: false
        },
        
        initialize: function (video, options) {
            // something with options
            
            this.video = document.id(video);
            this.parent();
        },
        
        build: function () {
            
        }
    }),
    
    Iterator: new Class({
        initialize: function (items) {
            this.items = items || [];
            this.index = 0;
        },
        
        key: function () {
            return this.valid(this.index) ? this.index : false;
        },
        
        length: function () {
            return this.items.length;
        },
        
        valid: function (key) {
            return !(key < 0 || key > this.length() - 1);
        },
        
        find: function (key) {
            return this.valid(key) ? this.items[key] : false;
        },
        
        first: function () {
            return this.setCurrent(0);
        },
        
        previous: function () {
            return this.setCurrent(this.index - 1);
        },
        
        hasPrevious: function () {
            return this.index > 0;
        },
        
        setCurrent: function (key) {
            key = key.toInt();
            
            if (this.valid(key)) {
                this.index = key;
                return this.items[this.key()];
            }
            
            return false;
        },
        
        getActive: function () {
            return this.items[this.key()];
        },
        
        hasNext: function () {
            return this.index < (this.length() - 1);
        },
        
        next: function () {
            return this.setCurrent(this.index + 1);
        },
        
        last: function () {
            return this.setCurrent(this.length() - 1);
        },
        
        each: function (callback) {
            this.items.each(callback, this);
        }
    }),
    
    Controls: new Class({
        initialize: function (video) {
            this.video = document.id(video);
            
            this.build();
            this.attach();
        },
        
        build: function () {
            
        },
        
        attach: function () {
            
        }
    })
};