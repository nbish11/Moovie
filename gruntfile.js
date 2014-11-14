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
                specs: 'Specs/*.js'
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    
    grunt.registerTask('test', ['jshint', 'jasmine']);
    
    grunt.registerTask('default', ['test']);
};
