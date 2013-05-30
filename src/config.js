require.config({
    deps: ['ganttd3'],

    urlArgs: "bust=" + (new Date()).getTime(),

    paths: {
        underscore: '../vendor/underscore',
        backbone: '../vendor/backbone',
        d3: '../vendor/d3.v3',

        // IE8 attempted fix.
        'aight': '../vendor/aight',
        'aight.d3': '../vendor/aight.d3'
    },

    shim: {
        backbone: {
            deps: ['underscore'],
            exports: 'Backbone'
        },

        underscore: {
            exports: '_'
        },

        d3: {
            exports: 'd3'
        },

        aight: {
            exports: 'aight'
        },

        'aight.d3': {
            deps: ['aight']
        }
    }
});