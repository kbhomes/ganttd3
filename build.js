({
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
})