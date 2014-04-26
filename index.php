<!DOCTYPE html>

<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Moovie</title>
        
        <link rel="stylesheet" href="//localhost/Moovie/src/css/Moovie-0.0.1alpha.css">
        
        <style>

body {
    background-image: url("chrome://global/skin/media/imagedoc-darknoise.png");
}

/* slider base styles */
 .slider {
    display: inline-block;
    vertical-align: middle;
    position: relative;
}

.slider .tooltip {
    display: block;
    font-size: 12px;
    line-height: 1.4;
    opacity: 0;
    position: absolute;
    visibility: visible;
    z-index: 1030;
}

.slider .tooltip .arrow {
    border-color: rgba(0, 0, 0, 0);
    border-style: solid;
    height: 0;
    position: absolute;
    width: 0;
}

.slider .tooltip .content {
    background-color: #000000;
    border-radius: 4px;
    color: #FFFFFF;
    max-width: 200px;
    padding: 3px 8px;
    text-align: center;
    text-decoration: none;
    white-space: nowrap;
    font-size: 12px;
    line-height: 1.4;
    visibility: visible;
}

.slider .tooltip.top {
    margin-top: -3px;
    padding: 5px 0;
    bottom: 100%;
}

.slider .tooltip.top .arrow {
    border-top-color: #000000;
    border-width: 5px 5px 0;
    bottom: 0;
    left: 50%;
    margin-left: -5px;
}

.slider.horizontal {
    width: 100%;
    height: 20px;
}

.slider.horizontal.reversed .track .bar {
    left: auto;
    right: 0;
    width: 0;
}

.slider.horizontal.reversed .track .knob {
    left: 100%;
}

.slider.vertical {
    width: 20px;
    height: 100%;
}

.slider.vertical.reversed .track .bar {
    top: auto;
    bottom: 0;
    height: 0;
}

.slider.vertical.reversed .track .knob {
    top: 100%;
}

.slider .track {
    background-image: linear-gradient(to bottom, #F5F5F5 0%, #F9F9F9 100%);
    background-repeat: repeat-x;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) inset;
    cursor: default;
    position: absolute;
    background: none repeat scroll 0 0 #FFFFFF;
    opacity: 0.7;
}

.slider .track .overlay {
    background: rgba(0,0,0,0.25);
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) inset;
    cursor: default;
    position: absolute;
}

.slider .track .bar {
    background: none repeat scroll 0 0 #BABABA;
    border-radius: 4px;
    box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.15) inset;
    position: absolute;
}

.slider .track .knob {
    background: none repeat scroll 0 0 #B9DC84;
    border: 2px solid #FFFFFF;
    height: 10px;
    position: absolute;
    width: 10px;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2) inset, 0 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    cursor: pointer;
}

/* slider track styles */
 .slider.horizontal .track {
    width: 100%;
    margin-top: -5px;
    top: 50%;
    left: 0;
    height: 8px;
}

.slider.vertical .track {
    width: 8px;
    height: 100%;
    margin-left: -5px;
    left: 50%;
    top: 0;
}

/* slider overlay styles */
.slider.horizontal .track .overlay {
    height: 10px;
    width: 0;
    margin-top: -5px;
    top: 50%;
    left: 0;
}

.slider.vertical .track .overlay {
    width: 10px;
    height: 0;
    margin-left: -5px;
    left: 50%;
    top: 0;
}

/* slider bar styles */
 .slider.horizontal .track .bar {
    height: 100%;
    top: 0;
    bottom: 0;
    width: 0;
}

.slider.vertical .track .bar {
    width: 100%;
    left: 0;
    right: 0;
    height: 0;
}

/* slider knob styles */
 .slider.horizontal .track .knob {
    margin-left: -7px;
    margin-top: -3px;
}

.slider.vertical .track .knob {
    margin-left: -3px;
    margin-top: -7px;
}

.time {
    background: url("http://colinaarts.com/assets/player-progress-time-arrow.png") no-repeat scroll left bottom rgba(0, 0, 0, 0);
    left: 0;
    padding: 0 0 5px 1.5px;
    position: absolute;
    top: -33px;
}

.time .text {
    background: none repeat scroll 0 0 rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 4px;
    font-size: 0.9em;
    left: -50%;
    line-height: 1;
    padding: 5px;
    position: relative;
}

/* popup base */
.moovie .popup { outline:none; position: relative}
.moovie .popup span {
    z-index: 10;
    position: absolute;
    padding: 1em .5em;
    line-height: 1em;
    color: #fff;
    text-decoration: none;
    box-shadow: 1px 1px 2px rgba(55,55,55,.3);
    white-space: nowrap;
    background: none repeat scroll 0 0 rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s .25s, opacity .25s linear;
}

.moovie .popup span img {
  position: absolute;
  width: 0;
  height: 0;
  border: .5em solid transparent;
}

/* north */
.moovie .popup.north span {
  top: -225%;
  left: -25%;
  margin-left: 1em;
  margin-top: 0;
}

.moovie .popup.north span img {
  border-top: .5em solid rgba(0, 0, 0, 0.8);
  bottom: -1em;
  left: 1em;
}

/* south */
.moovie .popup.south span {
  bottom: -225%;
  left: -25%;
  margin-left: 1em;
  margin-top: 100%;
}

.moovie .popup.south span img {
  border-bottom: .5em solid rgba(0, 0, 0, 0.8);
  top: -1em;
  left: 1em;
}

/* east */
.moovie .popup.east span {
  top: 0;
  left: 100%;
  margin-left: 1em;
  margin-top: -.5em;
}

.moovie .popup.east span img {
  border-right: .5em solid rgba(0, 0, 0, 0.8);
  top: .5em;
  left: -1em;
}

/* west */
.moovie .popup.west span {
  top: 0;
  right: 100%;
  margin-right: 1em;
  margin-top: -.5em;;
}

.moovie .popup.west span img {
  border-left: .5em solid rgba(0, 0, 0, 0.8);
  top: .5em;
  right: -1em;
}

/* event: hover */
.moovie .popup:hover span {
  visibility: visible;
  opacity: 1;
  transition: opacity .25s linear;
}

.moovie .volume .popup span {
    padding: 13px 9px;
    height: 50px;
    bottom: 100%;
    left: -100%;
    margin-bottom: 10px;
    margin-left: 0;
    margin-top: 0;
    top: auto;
}

/* OVERIDES */
.slider.vertical .track .bar {
    width: 100%;
    left: 0;
    right: 0;
    height: 0;
    bottom: 0;
}

.moovie .controls .seekbar .time {
    background: url("http://colinaarts.com/assets/player-progress-time-arrow.png") no-repeat scroll left bottom rgba(0, 0, 0, 0);
    left: 0;
    padding: 0 0 5px 1.5px;
    position: absolute;
    top: -33px;
}

.moovie .controls .seekbar .time > div {
    background: none repeat scroll 0 0 rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 4px;
    font-size: 0.9em;
    left: -50%;
    line-height: 1;
    padding: 5px;
    position: relative;
}
        </style>
    </head>
    <body>
        <video id="myvideo" poster="http://colinaarts.com/assets/avatar.png" src="http://colinaarts.com/assets/avatar.ogv" controls>
            <track kind="subtitles" label="English subtitles" src="http://localhost/Moovie/avatar.srt" srclang="en" default></track>
        </video>
        
        <script src="//cdnjs.cloudflare.com/ajax/libs/mootools/1.4.5/mootools-core-full-compat-yc.js"></script>
        <script src="//cdnjs.cloudflare.com/ajax/libs/mootools-more/1.4.0.1/mootools-more-yui-compressed.js"></script>
        <script src="//localhost/Moovie/src/js/vendor/Moovie/Moovie-0.0.1alpha.js"></script>
        
        <script>
            /*
            var video = {
                video   : $$('video')[0],
                id      : 'avatar',
                options : {
                    'debug'    : true,
                    'playlist' : [
                        {
                            'id'    : 'alice',
                            'src'   : 'http://colinaarts.com/assets/alice.ogv'
                        },
                        {
                            'id'    : 'shrek',
                            'src'   : 'http://colinaarts.com/assets/shrek.ogv',
                            'title' : '<cite>Shrek Forever After</cite> theatrical trailer'
                        }
                    ]
                }
            };
            
            Moovie([video]);  // Must be passed in as array.
            */
        </script>
    </body>
</html>