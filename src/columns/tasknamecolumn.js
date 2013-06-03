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
            var rowName = 'row-' + this.get('name');
            var gantt = this.get('gantt');
            var settings = gantt.get('settings');

            // The selection is the enter() selection so this does not need to be stored.
            var group = selection.append('td').classed(rowName, true);

            group.append('span')
                .attr('class', Task.prototype.method('getIndentClass'))
                .classed(rowName + '-indent', true)

            group
                .append('span').classed(rowName + '-show-hide', true)
                .text(Task.prototype.method('getRowHidden'))
                .style('font-weight', Task.prototype.method('getRowFontWeight'))
                .style('visibility', 'hidden')
                .filter(Task.prototype.accessor('group'))
                .style('visibility', 'visible')
                .on('click', function(d,i) {
                    d.toggleChildren();
                    d3.select(this).text(d.getRowHidden());
                    gantt.redraw();
                });

            group.append('span').classed(rowName + '-number', true)
                .text(Task.prototype.accessor('number'))
                .style('font-weight', Task.prototype.method('getRowFontWeight'))
                .on('click', function(d,i) {
                    if (settings.linkCallback)
                        settings.linkCallback.call(this, d, i);
                });

            group.filter(Task.prototype.accessor('group'))
                .append('a').classed(rowName + '-focus', true)
                .text('[focus]')
                .on('click', function(d,i) {
                    var children;

                    if (d.get('parent')) {
                        children = d.get('parent').getChildren(true);
                    }
                    else {
                        children = {
                            children: gantt.get('data').models
                        }
                    }

                    // Go through each task on this same level.
                    _.each(children.children, function(cd,ci) {
                        if (d.get('id') == cd.get('id')) {
                            if (d.get('collapsed'))
                                d.toggleChildren();

                            return;
                        }

                        if (!cd.get('collapsed'))
                            cd.toggleChildren();
                    });
                });

        }
    });
});