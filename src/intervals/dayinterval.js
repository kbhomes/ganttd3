define(function(require) {
    var Interval = require('intervals/interval'),
        Base = require('util/base'),
        Util = require('util/util'),
        d3 = require('d3'),
        _ = require('underscore');

    // DayInterval
    return Interval.extend({
        defaults: {
            name: 'day',
            unitWidth: 20,
            unitCellWidth: 19,
            unitFormat: d3.time.format('%-d'),
            unitInterval: d3.time.day,
            groupInterval: d3.time.week
        },

        getMinGroup: function(data, accessor) {
            var group = this.get('groupInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return group.floor(d3.min(filtered, funcAccessor));
            else
                return null;
        },

        getMaxGroup: function(data, accessor) {
            var group = this.get('groupInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return group.ceil(d3.max(filtered, funcAccessor));
            else
                return null;
        },

        getUnitBackgroundColor: function(d,i) {
            var unit = this.get('unitInterval');

            // Today or not.
            if (unit.floor(d).getTime() == unit.floor(new Date()).getTime()) {
                return '#dbd';
            }
            else {
                // Beginning or the end of the week.
                if ((i % 7) == 0 || (i % 7) == 6)
                    return '#eee';
                else
                    return '';
            }
        },

        getGroupText: function(start) {
            return Util.fullDateFormat(start) + ' to ' + Util.fullDateFormat(this.get('unitInterval').offset(start, 6));
        },

        appendGroupCell: function(sel) {
            // Append a date range for the week to ranges row.
            sel.classed('date-range', true)
                .attr('colspan', 7)
                .text(_.bind(this.getGroupText, this));
        },

        getGroupSteps: function() {
            return _.filter(this.get('unitInterval').range.apply(undefined, this.get('domain')), function(d,i) {
                return i % 7 == 0;
            });
        },

        getUnitText: function(date) {
            return this.get('unitFormat')(date);
        }
    });
});