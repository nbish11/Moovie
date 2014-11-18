"use strict";

module.exports = function (grunt) {
    grunt.initConfig({
        jshint: {
            all: [
                'gruntfile.js',
                'Source/*.js',
                'Specs/*.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        
        jasmine: {
            src: 'Source/*.js',
            options: {
                vendor: [
                    'Lib/mootools-1.5.1/mootools-core-min-full-nocompat.js',
                    'Lib/mootools-1.5.1/mootools-more-min-full-nocompat-nolang.js'
                ],
                specs: 'Specs/*.js'
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    
    grunt.registerTask('test', ['jshint', 'jasmine']);
    
    grunt.registerTask('default', ['test']);
};
