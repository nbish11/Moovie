module.exports = function (config) {
    'use strict';
    
    var build = process.env.BUILD;
    var browser = process.env.BROWSER;
    
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'Lib/mootools-1.5.1/mootools-core-min-full-nocompat.js',
            'Lib/mootools-1.5.1/mootools-more-min-full-nocompat-nolang.js',
            'Source/*.js',
            'Specs/*.js'
        ],

        // list of files to exclude
        exclude: [
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['mocha', 'saucelabs'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_WARN,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Firefox', 'Chrome'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,
        
        // set timeouts needed for Sauce Labs 
        captureTimeout: 4 * 60 * 1000,
        browserNoActivityTimeout: 4 * 60 * 1000,
        browserDisconnectTimeout: 2000,
        browserDisconnectTolerance: 1,
        
        // Sauce Labs add-on configuration
        sauceLabs: {
            testName: 'Moovie - Build: ' + build + ' Browser: ' + browser
        },

        customLaunchers: {
            windows_firefox: {
                base 'SauceLabs',
                browserName: 'firefox',
                platform: 'Windows 7'
            },
            chrome_linux: {
                base: 'SauceLabs',
                browserName: 'chrome',
                platform: 'Linux'
            }
        }
    });
};
