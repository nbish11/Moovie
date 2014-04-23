Moovie
======
Moovie is a custom media API written in MooTools for the HTML5 "video" tag. Or at least that's the direction it's heading in. Moovie is still currently in it's design phase and is not yet considered "production" ready.

This project was originally started by [Colin Aarts](http://colinaarts.com/code/moovie/) and with his permission, I have taken over it's development.

For more information about Moovie's API, please visit the [Wiki]().

Features
------------
* Track support (SRT only)
* Styled with CSS
* Advanced volume control
* Playlist support (JSON)
* Supports Fullscreen
* Realtime Debug panel
* HUD interface.

Requirements
------------
* MooTools Core 1.3+
* MooTools More 1.3.0.1+ (Drag, Tips, HTMLTable)

Basic Usage
---
Please make sure you download from the "alpha" branch. The "master" branch contains Colin's original script.


First, include the required scripts inside the ```<body>``` tag down the bottom.
```html
<script src="//mydomain.com/js/vendor/mootools/1.4.5/mootools-yui-compressed.js"></script>
<script src="//mydomain.com/js/vendor/mootools/mootools-more-1.4.0.1.js"></script>
<script src="//mydomain.com/js/vendor/moovie/0.2.5/moovie-yui-compressed.js"></script>
```

Now to instantiate:
```js
// For a single video element...
var myVideo = new Moovie('myVideo', {
    //Options
    debug: true,
    playlist: 'http://mydomain.com/playlist.json'
});

// For multiple video elements...
$$('video').Moovie({
    // Options are shared among all instances
    debug: true,
    autohide: false
});

// And to retreive...
var instance3 = $$('video')[2].retreive('moovie');
```

Demo
----
See: http://colinaarts.com/code/moovie/

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
