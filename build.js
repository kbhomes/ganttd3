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
    optimize: 'none'
})