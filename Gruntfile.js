module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            options: {
                nospawn: true
            },

            scripts: {
                files: ['lib/**/*.js', 'src/**/*.js'],
                tasks: ['requirejs']
            },

            stylesheets: {
                files: ['src/**/*.scss'],
                tasks: ['sass']
            }
        },

        requirejs: {
            compile: {
                options: {
                    baseUrl: 'src',
                    name: '../lib/almond',

                    mainConfigFile: 'src/main.js',
                    include: ['ganttd3'],
                    out: 'build/ganttd3.js',

                    wrap: {
                        startFile: 'build/start.js',
                        endFile: 'build/end.js'
                    },

                    paths: {
                        underscore: '../lib/shims/underscore.shim',
                        backbone: '../lib/shims/backbone.shim',
                        d3: '../lib/shims/d3.v3.shim',
                        aight: '../lib/shims/aight.shim',
                        'aight.d3': 'empty:'
                    },

                    optimize: 'none'
                }
            }
        },

        uglify: {
            build: {
                src: 'build/ganttd3.js',
                dest: 'build/ganttd3.min.js'
            }
        },

        sass: {
            dist: {
                files: {
                    'build/ganttd3.css': 'src/ganttd3.scss'
                }
            }
        },

        clean: ['build/ganttd3.js', 'build/ganttd3.min.js', 'build/ganttd3.css']
    });

    // Load the plugin that provides the "requirejs" task.
    // Load the plugin that provides the "uglify" task.
    // Load the plugin that provides the "sass" task.
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Load the plugin that provides the "clean" task.
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task(s).
    grunt.registerTask('default', ['requirejs', 'uglify', 'sass']);

};