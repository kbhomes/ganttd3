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

        render: function(update, enter) {
            var rowName = this.getRowName();
            var settings = this.get('gantt').get('settings');

            var _bars = function(sel) {
            };

            var _estBars = function(sel, scale) {
                sel.style('left', function(d,i) { return scale(d) + 'px'; })
                    .style('top', function(d,i) { return ((settings.rowHeight - settings.barHeight * 2) / 2 - 2) + 'px'; });
            };

            var _estBarsFull = function(sel, scale) {
                sel.style('height', Util.plusPx(Task.prototype.method('getBarHeight')))
                    .style('width', function(d,i) { return Math.floor(scale(d))  + 'px'; })
                    .style('background-color', Task.prototype.method('getBarColor'));
            };

            var _estBarsCompleted = function(sel, scale) {
                sel.style('top', Util.plusPx(Task.prototype.method('getBarCompletionTop')))
                    .style('height', Util.plusPx(Task.prototype.method('getBarCompletionHeight')))
                    .style('width', function(d,i) { return Math.floor(scale(d) * (d.get('completed') / 100)) + 'px'; })
                    .style('background-color', Task.prototype.method('getBarCompletionColor'));
            };

            var _actBars = function(sel, scale) {
                sel.style('left', function(d,i) { return scale(d) + 'px'; })
                    .style('top', function(d,i) { return ((settings.rowHeight - settings.barHeight * 2) / 2 + settings.barHeight - 1) + 'px'; });
            };

            var _actBarsFull = function(sel, scale) {
                sel.style('height', Util.plusPx(Task.prototype.method('getBarHeight')))
                    .style('width', function(d,i) { return Math.floor(scale(d))  + 'px'; })
                    .style('background-color', d3.rgb("#AAA").toString());
            };

            var _actBarsCompleted = function(sel, scale) {
                sel.style('top', Util.plusPx(Task.prototype.method('getBarCompletionTop')))
                    .style('height', Util.plusPx(Task.prototype.method('getBarCompletionHeight')))
                    .style('width', function(d,i) { return Math.floor(scale(d) * (d.get('completed') / 100)) + 'px'; })
                    .style('background-color', d3.rgb("#AAA").darker().toString());
            };

//            if (enter.length) {
//                // There is new data coming in, so remove all the date ranges,
//                // day cells, and bars. We'll be adding that again later.
//                d3.selectAll('td.date-range').remove();
//                d3.selectAll('td.day-cell').remove();
//                d3.selectAll('td.' + rowName).remove();
//            }
//
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

            var unitSteps = interval.getUnitSteps();
            var groupSteps = interval.getGroupSteps();
            var maxWidth = unitSteps.length * interval.get('unitWidth');
            interval.setRange([0, maxWidth]);

            var scaleX = interval.getXScale();
            var scaleWidth = interval.getWidthScale();

            var ranges = d3.select('tr.date-ranges').selectAll('td.date-range').data(groupSteps, _.identity);
            var columns = d3.select('tr.columns').selectAll('td.day-cell').data(unitSteps, _.identity);

            // Update selection
            {
                // Create a cell to span the whole bars area.
                var cell = update.selectAll('td.' + rowName).attr('colspan', unitSteps.length);
                var group = cell.selectAll('div.' + rowName + '-container');
                var overlay = group.selectAll('div.overlay');
                var bars = group.selectAll('div.' + rowName + '-bars');

                // Create the bars that represent the estimated completion dates.
                var estScaleX = function(d) { return scaleX(d.get('estStartDate')); };
                var estScaleWidth = function(d) { return scaleWidth(d.get('estStartDate'), d.get('estEndDate')); };

                // Remove estimate date bars if either estStartDate or estEndDate don't exist.
                bars.selectAll('div.bar.' + rowName + '-est').filter(function(d) { return !d.get('estStartDate') || !d.get('estEndDate'); }).remove();

                var estBars = bars
                    .filter(function(d) { return d.get('estStartDate') && d.get('estEndDate'); })
                    .selectAll('div.bar.' + rowName + '-est')
                    .call(_estBars, estScaleX);

                var estBarsFull = estBars
                    .selectAll('div.' + rowName + '-est-full')
                    .call(_estBarsFull, estScaleWidth);

                var estBarsCompleted = estBars
                    .selectAll('div.' + rowName + '-est-completed')
                    .call(_estBarsCompleted, estScaleWidth);

                // Create the bars that represent the actual completion dates.
                var actScaleX = function(d) { return scaleX(d.get('actStartDate')); };
                var actScaleWidth = function(d) { return scaleWidth(d.get('actStartDate'), d.get('actEndDate')); };

                // Remove actual date bars if either actStartDate or actEndDate don't exist.
                bars.selectAll('div.bar.' + rowName + '-act').filter(function(d) { return !d.get('actStartDate') || !d.get('actEndDate'); }).remove();

                var actBars = bars
                    .filter(function(d) { return d.get('actStartDate') && d.get('actEndDate'); })
                    .selectAll('div.bar.' + rowName + '-act')
                    .call(_actBars, actScaleX);

                var actBarsFull = actBars
                    .selectAll('div.' + rowName + '-act-full')
                    .call(_actBarsFull, actScaleWidth);

                var actBarsCompleted = actBars
                    .selectAll('div.' + rowName + '-act-completed')
                    .call(_actBarsCompleted, actScaleWidth);
            };

            // Enter selection
            {
                // Create a cell to span the whole bars area.
                var cell = enter.append('td')
                    .classed(rowName, true)
                    .attr('colspan', unitSteps.length);

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

                var estBars = bars
                    .filter(function(d) { return d.get('estStartDate') && d.get('estEndDate'); })
                    .append('div')
                    .classed(rowName + '-est', true)
                    .classed('bar', true)
                    .call(_estBars, estScaleX);

                var estBarsFull = estBars
                    .append('div')
                    .classed(rowName + '-est-full', true)
                    .call(_estBarsFull, estScaleWidth);

                var estBarsCompleted = estBars
                    .append('div')
                    .classed(rowName + '-est-completed', true)
                    .call(_estBarsCompleted, estScaleWidth);

                // Create the bars that represent the actual completion dates.
                var actScaleX = function(d) { return scaleX(d.get('actStartDate')); };
                var actScaleWidth = function(d) { return scaleWidth(d.get('actStartDate'), d.get('actEndDate')); };

                var actBars = bars
                    .filter(function(d) { return d.get('actStartDate') && d.get('actEndDate'); })
                    .append('div')
                    .classed(rowName + '-act', true)
                    .classed('bar', true)
                    .call(_actBars, actScaleX);

                var actBarsFull = actBars
                    .append('div')
                    .classed(rowName + '-act-full', true)
                    .call(_actBarsFull, actScaleWidth);

                var actBarsCompleted = actBars
                    .append('div')
                    .classed(rowName + '-act-completed', true)
                    .call(_actBarsCompleted, actScaleWidth);
            };

            // Update the date ranges.
            var rangesUpdate = ranges.call(_.bind(interval.appendGroupCell, interval));
            var rangesExit = ranges.exit().remove();
            var rangesEnter = ranges.enter().append('td').call(_.bind(interval.appendGroupCell, interval));
            ranges.order();

            // Update the date columns.
            var columnsUpdate = columns
                .select('div.inner')
                .style('width', Util.plusPx(interval.get('unitCellWidth')))
                .select('div.background')
                .style('background-color', _.bind(interval.getUnitBackgroundColor, interval))
                .style('width', Util.plusPx(interval.get('unitCellWidth')))
                .text(_.bind(interval.getUnitText, interval));

            // Remove the exiting columns.
            var columnsExit = columns.exit().remove();

            // The date columns enter selection.
            var columnsEnter = columns.enter()
                .append('td')
                .classed('day-cell', true)
                    .append('div')
                    .classed('inner', true)
                    .style('width', Util.plusPx(interval.get('unitCellWidth')))
                        .append('div')
                        .classed('background', true)
                        .style('background-color', _.bind(interval.getUnitBackgroundColor, interval))
                        .style('width', Util.plusPx(interval.get('unitCellWidth')))
                        .text(_.bind(interval.getUnitText, interval));

            // Reorder the columns.
            columns.order();

//            _.each(steps, function(d,i) {
//                interval.appendGroupCell(d, i, ranges);
//
//                var cols = d3.select('tr.columns');
//                var background = interval.getUnitBackgroundColor(d,i);
//
//                var colCells = cols.append('td').classed('day-cell', true);
//                var colDivs = colCells.append('div').classed('inner', true).style('width', Util.plusPx(interval.get('unitCellWidth')));
//                var colDays = colDivs.append('div')
//                    .classed('background', true)
//                    .style('background-color', background)
//                    .style('width', Util.plusPx(interval.get('unitCellWidth')))
//                    .text(interval.getUnitText(d));
//            });
        },

        displayPopup: function(model) {
            var g = model.get('gantt');

            return function(d,i) {
                var e = d3.event;
                var m = [(e.pageX || e.clientX) + 5, (e.pageY || e.clientY) + 5]; // IE fix.

                var popup = d3.select('.taskpopup');
                popup.select('.corner').style('border-right-color', d.getBarColor().toString());
                popup.select('.taskname').text(d.get('name'));

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

                popup.style('display', 'block');

                // Figure out if this popup is extending past the edge of the window and needs to be relocated.
                var width = popup.node().clientWidth;
                var height = popup.node().clientHeight;
                var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

                if (e.clientX + width + 30 > windowWidth)
                    m[0] -= width + 10;
                if (e.clientY + height + 30 > windowHeight)
                    m[1] -= height + 10;

                popup.style('left', m[0] + 'px')
                    .style('top', m[1] + 'px');
            };
        },

        hidePopup: function() {
            d3.select('.taskpopup').style('display', 'none');
        }
    });
});