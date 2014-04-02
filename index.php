<!DOCTYPE html>

<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Moovie</title>
        
        <link rel="stylesheet" href="//localhost/Moovie/src/css/Moovie-0.0.1alpha.css">
    </head>
    <body>
    <div class="moovie" style="width: 600px; height: 250px;">
        <div class="wrapper">
            <video id="myvideo" autobuffer="" poster="http://colinaarts.com/assets/avatar.png" src="http://colinaarts.com/assets/avatar.ogv" controls>
                <p>Your browser does not support the HTML 5<code style="display: none;">video</code><code class="standardLighter ">video</code>element.</p>
            </video>
        </div>
    </div>
        
        <script src="//ajax.googleapis.com/ajax/libs/mootools/1.4.5/mootools-yui-compressed.js"></script>
        <script src="//localhost/Moovie/mootools-more-1.4.0.1.js"></script>
        <script src="//localhost/Moovie/src/js/vendor/Moovie/Moovie-0.0.1alpha.js"></script>
        
        <script>
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
        </script>
    </body>
</html>