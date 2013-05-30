module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        requirejs: {
            options: {
                keepBuildDir: true,
                baseUrl: 'src/',
                mainConfigFile: 'src/config.js',
                name: 'ganttd3',
                out: "build/ganttd3.js"
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');

    // Default task(s).
    grunt.registerTask('default', ['requirejs']);
};