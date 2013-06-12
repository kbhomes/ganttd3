define(function(require) {
    var Base = require('util/base'),
        d3 = require('d3'),
        _ = require('underscore');

    // Interval
    return Base.extend({
        defaults: {
            name: '',
            unitWidth: 20,
            unitCellWidth: 19,
            unitFormat: d3.time.format('%-d'),
            unitInterval: d3.time.day,
            groupInterval: d3.time.week
        },

        getUnitBackgroundColor: function(d,i) { },

        getMinGroup: function(data, accessor) { },

        getMaxGroup: function(data, accessor) { },

        setDomain: function(domain) {
            this.set('domain', domain);
        },

        setRange: function(range) {
            this.set('range', range);
        },

        getUnitSteps: function() {
            return this.get('unitInterval').range.apply(undefined, this.get('domain'));
        },

        getGroupSteps: function() {
            return this.get('groupInterval').range.apply(undefined, this.get('domain'));
        },

        getGroupText: function(start) { },

        appendGroupCell: function(sel) { },

        getUnitText: function(date) { },

        getXScale: function() {
            var scale = d3.time.scale()
                .domain(this.get('domain'))
                .rangeRound(this.get('range'));

            return scale;
        },

        getWidthScale: function() {
            var scale = this.getXScale();
            var correct = this.correctDate;

            return function(start, end) {
                return scale(correct(end)) - scale(start);
            }
        },

        // Used to add one day to the input. This is done because a
        // task that ends on a certain day should be shown as filling
        // that whole day on the Gantt chart.
        correctDate: function(arg) {
            var inner = function(date) {
                return d3.time.day.offset(date, 1);
            };
            if (_.isFunction(arg))
                return _.compose(inner, arg);
            else
                return inner(arg);
        }
    });
});