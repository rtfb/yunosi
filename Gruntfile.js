module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'), // the package file to use

        browserify: {
            dist: {
                files: {
                    'build/background.js': [
                        'background.js'
                    ]
                },
                options: {
                    browserifyOptions: {
                        standalone: 'nlp'
                    }
                }
            }
        },
        blanket_qunit: {
            all: {
                options: {
                    urls: ['tests/index.html?coverage=true&gruntReport'],
                    threshold: 50
                }
            }
        },
        qunit: {
            all: {
                options: {
                    urls: ['tests/index.html?coverage=true']
                }
            }
        },
        qunit_blanket_lcov: {
            all: {
                files: [{
                    src: ['content.js', './build/background.js']
                }],
                options: {
                    dest: '.coverage-results/core.lcov',
                    force: true
                }
            }
        },
        coveralls: {
            options: {
                force: true
            },
            all: {
                src: '.coverage-results/core.lcov',
            }
        },
        watch: {
            files: [
                'tests/*.js',
                'tests/*.html',
                '*.js'
            ],
            tasks: ['browserify', 'blanket_qunit', 'jslint']
        },
        jslint: {
            client: {
                src: [
                    '*.js'
                ],
                exclude: [
                    'Gruntfile.js',
                    'background.js',
                    'fsmsearch.js'
                ],
                directives: {
                    browser: true,
                    predef: [
                        'chrome',
                        'console',
                        'Node',
                        'NodeFilter'
                    ],
                    continue: true,
                    todo: true,
                    unparam: true,
                    white: true
                }
            },
            server: {
                src: [
                    'background.js',
                    'fsmsearch.js'
                ],
                directives: {
                    continue: true,
                    predef: [
                        'chrome'
                    ],
                    node: true,
                    todo: true,
                    unparam: true,
                    white: true,
                    nomen: true
                }
            }
        }
    });
    // load up your plugins
    grunt.loadNpmTasks('grunt-blanket-qunit');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-qunit-blanket-lcov');
    // register one or more task lists (you should ALWAYS have a "default" task list)
    grunt.registerTask('test_cover', ['qunit_blanket_lcov', 'qunit']);
    grunt.registerTask('default', ['browserify', 'blanket_qunit', 'jslint']);
};
