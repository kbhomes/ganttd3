define(function(require) {
    var d3 = require('d3'),
        _ = require('underscore');

    return {

        /**
         * Adds 'px' to the end of the input string or function result.
         *
         * @param {string|function} arg A string, or a function that returns a string,
         *     to append 'px' to.
         * @return {string}
         */
        plusPx: function(arg) {
            var inner = function(str) {
                return str + 'px';
            };
            if (_.isFunction(arg))
                return _.compose(inner, arg);
            else
                return inner(arg);
        },

        /**
         * Returns a copy of an array where each item returns a truth-y value when passed
         * to the accessor function, or who has a truth-y attribute named by accessor.
         *
         * @param {array} data
         * @param {string|function} accessor
         * @returns {array}
         */
        accessorFilter: function(data, accessor) {
            return _.filter(data, function(d) {
                if (_.isFunction(accessor))
                    return accessor(d);
                else
                    return d.get(accessor);
            })
        },

        fullDateFormat: d3.time.format('%Y-%m-%d')
    };
});