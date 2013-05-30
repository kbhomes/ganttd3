require.config({
    urlArgs: "bust=" + (new Date()).getTime(),

    paths: {
        underscore: '../lib/underscore',
        backbone: '../lib/backbone',
        d3: '../lib/d3.v3',

        // IE8 attempted fix.
        'aight': '../lib/aight',
        'aight.d3': '../lib/aight.d3'
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