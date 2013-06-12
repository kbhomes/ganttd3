define(function(require) {
    var Interval = require('intervals/interval'),
        Base = require('util/base'),
        Util = require('util/util'),
        d3 = require('d3');

    // MonthInterval
    return Interval.extend({
        defaults: {
            name: 'month',
            unitWidth: 60,
            unitCellWidth: 59,
            unitFormat: d3.time.format('%b'),
            unitInterval: d3.time.month,
            groupInterval: d3.time.year
        },

        getMinGroup: function(data, accessor) {
            var unit = this.get('unitInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return unit.floor(d3.min(filtered, funcAccessor));
            else
                return null;
        },

        getMaxGroup: function(data, accessor) {
            var unit = this.get('unitInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return unit.ceil(d3.max(filtered, funcAccessor));
            else
                return null;
        },

        getUnitBackgroundColor: function(d,i) {
            var unit = this.get('unitInterval');

            // This month or not.
            if (unit.floor(d).getTime() == unit.floor(new Date()).getTime()) {
                return '#dbd';
            }
            else {
                return '';
            }
        },

        getGroupText: function(start) {
            return start.getFullYear();
        },

        appendGroupCell: function(sel) {
            // Append a year for every week.
            sel.classed('date-range', true)
                .attr('colspan', undefined)
                .text(this.getGroupText);
        },

        getGroupSteps: function() {
            return this.getUnitSteps();
        },

        getUnitText: function(date) {
            return this.get('unitFormat')(date);
        }
    });
});