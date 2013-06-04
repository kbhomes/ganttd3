define(function(require) {
    var Column = require('columns/column'),
        Task = require('tasks/task'),
        Util = require('util/util'),
        d3 = require('d3'),
        _ = require('underscore');

    // TaskBarsColumn
    return Column.extend({

        initialize: function() {
            this.set('name', 'bars')
        },

        renderHeading: function() { },

        render: function(selection) {
            var rowName = 'row-' + this.get('name');
            var settings = this.get('gantt').get('settings');

            if (selection.length) {
                // There is new data coming in, so remove all the date ranges,
                // day cells, and bars. We'll be adding that again later.
                d3.selectAll('td.date-range').remove();
                d3.selectAll('td.day-cell').remove();
                d3.selectAll('td.' + rowName).remove();
            }

            var selection = d3.select('table').selectAll('tr.row');
            var data = selection.data();

            var interval = settings.interval;

            if (data.length == 0)
                return;

            // This scale is for computing the positions/widths of the bars.
            var min = Math.min.apply(Math, _.filter([interval.getMinGroup(data, 'estStartDate'), interval.getMinGroup(data, 'actStartDate')], _.identity))
            var max = Math.max.apply(Math, _.filter([interval.getMaxGroup(data, 'estEndDate'), interval.getMaxGroup(data, 'actEndDate')], _.identity));
            var domain = [min, max];
            interval.setDomain(domain);
            var steps = interval.getUnitSteps();
            var maxWidth = steps.length * interval.get('unitWidth');
            interval.setRange([0, maxWidth]);

            var scaleX = interval.getXScale();
            var scaleWidth = interval.getWidthScale();

            var ranges = d3.select('tr.date-ranges');

            _.each(steps, function(d,i) {
                interval.appendGroupCell(d, i, ranges);

                var cols = d3.select('tr.columns');
                var background = interval.getUnitBackgroundColor(d,i);

                var colCells = cols.append('td').classed('day-cell', true);
                var colDivs = colCells.append('div').classed('inner', true).style('width', Util.plusPx(interval.get('unitCellWidth')));
                var colDays = colDivs.append('div')
                    .classed('background', true)
                    .style('background-color', background)
                    .style('width', Util.plusPx(interval.get('unitCellWidth')))
                    .text(interval.getUnitText(d));
            });

            // Create a cell to span the whole bars area.
            var cell = selection.append('td')
                .classed(rowName, true)
                .attr('colspan', steps.length);

            var group = cell.append('div')
                .classed(rowName + '-container', true)
                .classed('group', Task.prototype.accessor('group'));

            var overlay = group.append('div').classed('overlay', true);

            var bars = group.append('div')
                .classed(rowName + '-bars', true)
                .on('mousemove', this.displayPopup(this))
                .on('mouseout', this.hidePopup);

            // Create the bars that represent the estimated completion dates.
            var estScaleX = function(d) { return scaleX(d.get('estStartDate')); };
            var estScaleWidth = function(d) { return scaleWidth(d.get('estStartDate'), d.get('estEndDate')); };

            var estBars = bars.filter(function(d) { return d.get('estStartDate') && d.get('estEndDate'); })
                .append('div').classed(rowName + '-est', true)
                .classed('bar', true)
                .style('left', function(d,i) { return estScaleX(d) + 'px'; })
                .style('top', function(d,i) { return ((settings.rowHeight - settings.barHeight * 2) / 2 - 2) + 'px'; });

            var estBarsFull = estBars.append('div').classed(rowName + '-est-full', true)
                .style('height', Util.plusPx(Task.prototype.method('getBarHeight')))
                .style('width', function(d,i) { return Math.floor(estScaleWidth(d))  + 'px'; })
                .style('background-color', Task.prototype.method('getBarColor'));

            var estBarsCompleted = estBars.append('div').classed(rowName + '-est-completed', true)
                .style('top', Util.plusPx(Task.prototype.method('getBarCompletionTop')))
                .style('height', Util.plusPx(Task.prototype.method('getBarCompletionHeight')))
                .style('width', function(d,i) { return Math.floor(estScaleWidth(d) * (d.getComputedCompletion() / 100)) + 'px'; })
                .style('background-color', Task.prototype.method('getBarCompletionColor'));

            // Create the bars that represent the actual completion dates.
            var actScaleX = function(d) { return scaleX(d.get('actStartDate')); };
            var actScaleWidth = function(d) { return scaleWidth(d.get('actStartDate'), d.get('actEndDate')); };

            var actBars = bars.filter(function(d) { return d.get('actStartDate') && d.get('actEndDate'); })
                .append('div').classed(rowName + '-act', true)
                .classed('bar', true)
                .style('left', function(d,i) { return actScaleX(d) + 'px'; })
                .style('top', function(d,i) { return ((settings.rowHeight - settings.barHeight * 2) / 2 + settings.barHeight - 1) + 'px'; });

            var actBarsFull = actBars.append('div').classed(rowName + '-act-full', true)
                .style('height', Util.plusPx(Task.prototype.method('getBarHeight')))
                .style('width', function(d,i) { return Math.floor(actScaleWidth(d))  + 'px'; })
                .style('background-color', d3.rgb("#AAA").toString());

            var actBarsCompleted = actBars.append('div').classed(rowName + '-act-completed', true)
                .style('top', Util.plusPx(Task.prototype.method('getBarCompletionTop')))
                .style('height', Util.plusPx(Task.prototype.method('getBarCompletionHeight')))
                .style('width', function(d,i) { return Math.floor(actScaleWidth(d) * (d.getComputedCompletion() / 100)) + 'px'; })
                .style('background-color', d3.rgb("#AAA").darker().toString());
        },

        displayPopup: function(model) {
            var g = model.get('gantt');

            return function(d,i) {
                var e = d3.event;
                var m = [(e.pageX || e.clientX) + 5, (e.pageY || e.clientY) + 5]; // IE fix.

                var popup = d3.select('.taskpopup');
                popup.select('.corner').style('border-right-color', d.getBarColor().toString());
                popup.select('.taskname').text(d.get('number'));

                var table = popup.select('table.taskdata');

                // IE doesn't allow you to set innerHTML of table elements.
                if (typeof 'aight' !== 'undefined') {
                    var node = table.node();

                    while (node.hasChildNodes()) {
                        node.removeChild(node.lastChild);
                    }
                }
                else {
                    table.html('');
                }

                _.each(g.get('columns'), function(c) {
                    c.renderPopupData(table, d);
                });

                popup.style('display', 'block')
                    .style('left', m[0] + 'px')
                    .style('top', m[1] + 'px');
            };
        },

        hidePopup: function() {
            d3.select('.taskpopup').style('display', 'none');
        }
    });
});