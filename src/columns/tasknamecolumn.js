define(function(require) {
    var Column = require('columns/column'),
        Task = require('tasks/task'),
        _ = require('underscore');

    // TaskNameColumn
    return Column.extend({

        initialize: function() {
            this.set('name', 'name');
        },

        render: function(selection) {
            var rowName = this.getRowName();
            var gantt = this.get('gantt');
            var settings = gantt.get('settings');

            // The selection is the enter() selection so this does not need to be stored.
            var group = selection.append('td').classed(rowName, true);

            group.append('span')
                .attr('class', Task.prototype.method('getIndentClass'))
                .classed(rowName + '-indent', true)

            group.append('span').classed(rowName + '-show-hide', true)
                .text(Task.prototype.method('getRowHidden'))
                .style('font-weight', Task.prototype.method('getRowFontWeight'))
                .style('visibility', 'hidden')
                .filter(Task.prototype.accessor('group'))
                .style('visibility', 'visible')
                .on('click', function(d,i) {
                    d.toggleChildren();
                    gantt.redraw();
                });

            group.append('span').classed(rowName + '-name', true)
                .text(Task.prototype.accessor('name'))
                .attr('title', function(d) {
                    if (d.get('description'))
                        return d.get('description');
                    else
                        return d.get('name');
                })
                .style('font-weight', Task.prototype.method('getRowFontWeight'))
                .on('click', function(d,i) {
                    if (settings.linkCallback)
                        settings.linkCallback.call(this, d, i);
                });

            group.filter(Task.prototype.accessor('group'))
                .append('a').classed(rowName + '-collapse-all', true)
                .text('[collapse all]')
                .on('click', function(d,i) {
                    _.each(d.get('tasks'), function(cd,ci) {
                        if (cd.get('group') && !cd.get('collapsed'))
                            cd.toggleChildren();
                    });
                });

        }
    });
});