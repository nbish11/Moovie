module.exports = function (grunt) {
    'use strict';
    
    // All files and directories are derived 
    // from the sources provided in the "jshint" 
    // section. Take care when changing paths.
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            
            gruntfile: {
                src: 'gruntfile.js'
            },
            
            karmafile: {
                src: 'karma.conf.js'
            },
            
            all: {
                src: [
                    'Source/*.js',
                    'Specs/*.js'
                ]
            }
        },
        
        karma: {
            options: {
                configFile: '<%= jshint.karmafile.src %>'
            },
            
            unit: {
                browsers: ['windows_firefox', 'chrome_linux'],
                singleRun: true
            }
        },
        
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            
            karmafile: {
                files: '<%= jshint.karmafile.src %>',
                tasks: ['jshint:karmafile']
            },
            
            all: {
                files: '<%= jshint.all.src %>',
                tasks: ['jshint:all', 'karma']
            }
        }
    });
    
    require('load-grunt-tasks')(grunt);
    
    grunt.registerTask('monitor', ['watch']);
    grunt.registerTask('test', ['jshint', 'karma:unit']);
    grunt.registerTask('default', ['test']);
};
