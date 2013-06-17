define(function(require) {
    var Backbone = require('backbone'),
        Base = require('util/base'),

        Task = require('tasks/task'),
        TaskCollection = require('tasks/taskcollection'),

        Column = require('columns/column'),
        TaskNameColumn = require('columns/tasknamecolumn'),
        TaskBarsColumn = require('columns/taskbarscolumn'),

        DayInterval = require('intervals/dayinterval'),
        WeekInterval = require('intervals/weekinterval'),
        MonthInterval = require('intervals/monthinterval'),

        Colors = require('util/colors'),

        d3 = require('d3'),
        _ = require('underscore');

    return Base.extend({
        constructor: function(selector, customSettings) {
            // Call our super constructor.
            Base.apply(this);
            var gantt = this;

            // Create our settings object.
            var settings = _.defaults(customSettings || {}, {
                rowHeight: 25, // ganttd3.scss, line 1 - $row-height
                barHeight: 9,
                groupHeight: 7, // ganttd3.scss, line 7 - $group-bar-height
                barCompletionHeight: 3,
                groupCompletionHeight: 3,

                pathSeparator: '.',

                colorGenerator: function(d) {
                    if (d.get('group'))
                        return { bar: 'black', completion: '#555' };
                    else {
                        var color = Colors.lights(_.reduce(d.get('id').split(''), function(sum, c) { return sum + c.charCodeAt(); }, 0));
                        return { bar: color, completion: d3.rgb(color).brighter().toString() };
                    }
                },

                interval: new WeekInterval(),

                useDayInterval: function() { this.interval = new DayInterval(); gantt.redraw(); },
                useWeekInterval: function() { this.interval = new WeekInterval(); gantt.redraw(); },
                useMonthInterval: function() { this.interval = new MonthInterval(); gantt.redraw(); }
            });
            this.set('settings', settings);

            // Create our column models.
            var colName = new TaskNameColumn({ gantt: this });
            var colDuration = new Column({ gantt: this, name: 'duration', label: 'Est. Duration', accessor: Task.prototype.method('getEstDuration')});
            var colCompleted = new Column({ gantt: this, name: 'percent-completed', label: '% Completed', accessor: Task.prototype.method('getPercentCompletion')});
            var colEstStartDate = new Column({ gantt: this, name: 'est-start-date', label: 'Est. Start Date', accessor: Task.prototype.method('getFormattedDate', 'estStartDate')});
            var colEstEndDate = new Column({ gantt: this, name: 'est-end-date', label: 'Est. End Date', accessor: Task.prototype.method('getFormattedDate', 'estEndDate')});
            var colActStartDate = new Column({ gantt: this, name: 'act-start-date', label: 'Act. Start Date', accessor: Task.prototype.method('getFormattedDate', 'actStartDate')});
            var colActEndDate = new Column({ gantt: this, name: 'act-end-date', label: 'Act. End Date', accessor: Task.prototype.method('getFormattedDate', 'actEndDate')});
            var colBars = new TaskBarsColumn({ gantt: this });
            var columns = [colName, colDuration, colCompleted, colEstStartDate, colEstEndDate, colActStartDate, colActEndDate, colBars];
            this.set('columns', columns);

            // Create our TaskCollection that will hold all of our Task objects.
            var data = new TaskCollection();
            data.on('add remove', this.redraw, this);
            this.set('data', data);

            // Create our DOM elements.
            var table = d3.select(selector).append('table');
            this.set('selection', table);

            // First create the table row that will hold the date ranges.
            var rangesRow = table.append('tr')
                .classed('date-ranges', true)
                .style('opacity', 0);

            rangesRow.transition()
                .delay(200)
                .duration(200)
                .style('opacity', 1);

            //  This cell will cover all but the last (task bars) column.
            var rangesFillerCell = rangesRow.append('td').classed('spacer', true).attr('colspan', columns.length - 1);

            // Draw our columns.
            var columnsRow = table.append('tr')
                .classed('columns', true)
                .style('opacity', 0);

            columnsRow.transition()
                .delay(200)
                .duration(200)
                .style('opacity', 1);

            this.drawColumnHeadings(columnsRow);
            this.redraw();
        },

        createTask: function(options) {
            options = options || {}
            options.gantt = this;

            return new Task(options);
        },

        add: function(model) { //, options) {
            var gantt = this;
            var settings = this.get('settings')

            if (!model.has('gantt'))
                model.set('gantt', gantt);

            var path = model.get('path').slice(0);
            var parent;
            var search = this.get('data').models;
            var component;

            // Iterate through every element path component to work down the task tree.
            while (path.length) {
                component = path.shift();

                parent = _.find(search, function(t) {
                    return t.get('pathName') === component;
                });

                if (!parent) {
                    throw 'Component "' + component + '" in path "' + model.get('path') + '" does not exist'
                }

                search = parent.get('tasks');
            }

            // Add the task to the parent.
            model.set('parent', parent);
            search.push(model);
        },

        flattenTree: function(tasks) {
            var data = [];

            _.each(tasks, function(t) {
                data.push(t);
                data.push(this.flattenTree(t.get('tasks')));
            }, this);

            return _.chain(data).flatten().compact().value();
        },

        redraw: function() {
            var parent = this.get('selection');
            var data = this.flattenTree(this.get('data').models);

            // Get the data for this new redraw.
            var selection = parent.selectAll('tr.row').data(_.filter(data, function(cd,ci) {
                return cd.get('visible');
            }), Task.prototype.accessor('id'));

            // Create a row for every piece of data.
            var enter = selection.enter().append('tr').classed('row', true);

            // Update the current rows.
            selection.classed('group', Task.prototype.accessor('group'))
                .style('font-weight', Task.prototype.method('getRowFontWeight'));

            // Remove the non-existent rows.
            var exit = selection.exit().remove();

            // Reorder the elements so that any newly inserted elements are back where they belong.
            selection.order();

            // Render the columns.
            this.drawColumns(selection, enter);
        },

        drawColumnHeadings: function(columnsRow) {
            _.each(this.get('columns'), function(c) {
                c.renderHeading(columnsRow);
            })
        },

        drawColumns: function(update, enter) {
            _.each(this.get('columns'), function(c) {
                c.render(update, enter);
            });
        }
    });
});