module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'), // the package file to use

        qunit: { // internal task or name of a plugin (like "qunit")
            all: ['tests/*.html']
        },
        watch: {
            files: [
                'tests/*.js',
                'tests/*.html',
                '*.js'
            ],
            tasks: ['qunit', 'jslint']
        },
        jslint: {
            client: {
                src: [
                    'background.js'
                ],
                exclude: [
                    'Gruntfile.js'
                ],
                directives: {
                    browser: true,
                    predef: [
                        'chrome',
                        'console'
                    ]
                }
            }
        }
    });
    // load up your plugins
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jslint');
    // register one or more task lists (you should ALWAYS have a "default" task list)
    grunt.registerTask('default', ['qunit', 'jslint']);
};
