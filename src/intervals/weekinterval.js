define(function(require) {
    var Interval = require('intervals/interval'),
        Base = require('base'),
        Util = require('util'),
        d3 = require('d3');

    // WeekInterval
    return Interval.extend({
        defaults: {
            name: 'week',
            unitWidth: 40,
            unitCellWidth: 39,
            unitFormat: d3.time.format('%-m/%-d'),
            unitInterval: d3.time.week,
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

            // This week or not.
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

        appendGroupCell: function(d,i,ranges) {
            // Append a year for every week.
            ranges.append('td')
                .classed('date-range', true)
                .text(this.getGroupText(d));
        },

        getUnitText: function(date) {
            return this.get('unitFormat')(date);
        }
    });
});