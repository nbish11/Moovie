Moovie [![Build Status](https://travis-ci.org/nbish11/Moovie.svg)](https://travis-ci.org/nbish11/Moovie)
======
This is a custom controls library for the HTML5 video element.

Introduction
------------
Colin has done such an unbelievably amazing job on Moovie, that instead of forking it, I decided to get permission to take over the project, I emailed Colin last year and was able to get full permission to do so. By not forking it, it means Colin still holds the copyright (and he deserves to).

I've been busy myself and have not found the time in the past year to upload it or make any changes to the source. Due to bad email archiving I have lost the updated script that Colin had sent me and have decided to start again from scratch now that I have the time.

Requirements
------------
* MooTools Core 1.5.1
* MooTools More 1.5.1 (Drag, URI)

Use
---
This is just a quick summary, for a full depth informative guide please see the Moovie homepage: http://colinaarts.com/code/moovie/

For multiple videos with a base set of options:

```
var videos  = $$('video'),
    options = { debug: true, autohideControls: false };

Moovie(videos, options);
```

For multiple videos with custom and base options:

```
var options = { autohideControls: false }, // Generic options
    videos  = [
        { video: $('video-1'), id: 'my-video', options: { debug: true } },
        { video: $('video-2') },
        { video: $('video-3'), options: { autohideControls: true } } // overrides the generic option
    ];

Moovie(videos, options);
```

Single video with playlist:

```
var video = {
    "video": $$('video')[0],
    "id": "avatar",

    "options": {
        "debug": true,
        "playlist": [
            {
                "id": "alice",
                "src": "http://videos/alice.ogv",
                "tracks": [{
                    "src": "http://localhost/assets/alice-en-subs.srt",
                    "kind": "moovie"    // subtitles
                }]
            },
            {
                "id": "shrek",
                "src": "http://videos/shrek.ogv",
                "title": "<cite>Shrek Forever After</cite> theatrical trailer"
            }
        ]
    }
};

Moovie([video]);  // Must be passed in as array.
```

Demo
----
See: http://colinaarts.com/code/moovie/

Testing
-------
Because Moovie was created without tests, all pull requests and commits just 
have to pass JSLint for the time being. The test suite Moovie has been set up 
to use however, is Jasmine.

To run the Jasmine test suite and JSLint, type ```npm test``` at the command line.

Contributers
------------
* [Nathan Bishop](https://github.com/nbish11)

License
-------
The MIT License (MIT)

Copyright (c) 2010 Colin Aarts

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

