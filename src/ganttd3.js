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
                barCompletionHeight: 5,
                groupCompletionHeight: 3,

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
            var rangesFillerCell = rangesRow.append('td').attr('colspan', columns.length - 1);

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

        add: function(models, options) {
            var gantt = this;

            if (models.length) {
                // Add the gantt attribute to each model.
                _.each(models, function(m) {
                    if (!m.has('gantt')) {
                        m.set('gantt', gantt);
                    }
                });

                this.get('data').add(models, _.defaults(options || {}, {silent: true}));
                this.redraw();
            }
            else {
                if (!models.has('gantt'))
                    models.set('gantt', gantt);

                this.get('data').add(models, options);
            }
        },

        redraw: function() {
            var parent = this.get('selection');
            var data = this.get('data');

            // Get the data for this new redraw.
            var selection = parent.selectAll('tr.row').data(_.filter(data.models, function(cd,ci) {
                return cd.get('visible');
            }), Task.prototype.accessor('id'));

            // Remove the non-existent rows.
            var exit = selection.exit().remove();

            var enter = selection.enter();

            // Create a row for every piece of data.
            var tasks = enter.append('tr').classed('row', true)
                .classed('group', Task.prototype.accessor('group'));

            // Reorder the elements so that any newly inserted elements are back where they belong.
            selection.order();

            // Render the columns.
            this.drawColumns(tasks);
        },

        drawColumnHeadings: function(columnsRow) {
            _.each(this.get('columns'), function(c) {
                c.renderHeading(columnsRow);
            })
        },

        drawColumns: function(texts) {
            _.each(this.get('columns'), function(c) {
                c.render(texts);
            });
        }
    });
});