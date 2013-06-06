define(function(require) {
    var Column = require('columns/column'),
        Task = require('tasks/task'),
        _ = require('underscore');

    // TaskNameColumn
    return Column.extend({

        initialize: function() {
            this.set('name', 'name');
        },

        render: function(update, enter) {
            var rowName = this.getRowName();
            var gantt = this.get('gantt');
            var settings = gantt.get('settings');

            var _indent = function(sel) {
                sel.attr('class', Task.prototype.method('getIndentClass'))
                    .classed(rowName + '-indent', true);
            };

            var _showHide = function(sel) {
                sel.text(Task.prototype.method('getRowHidden'))
                    .style('font-weight', Task.prototype.method('getRowFontWeight'))
                    .style('visibility', 'hidden')
                    .filter(Task.prototype.accessor('group'))
                    .style('visibility', 'visible')
                    .on('click', function(d,i) {
                        d.toggleChildren();
                        gantt.redraw();
                    });
            };

            var _name = function(sel) {
                sel.text(Task.prototype.accessor('name'))
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
            };

            var _collapseAll = function(sel) {
                var filtered = sel.filter(Task.prototype.accessor('group'));

                // Remove the links that are already there (if this is the enter selection, there will be no links).
                filtered.selectAll('a').remove();

                // Add the links (if this is the update selection, the links will be added back in);
                filtered.append('a').classed(rowName + '-collapse-all', true)
                    .text('[collapse all]')
                    .on('click', function(d,i) {
                        _.each(d.get('tasks'), function(cd,ci) {
                            if (cd.get('group') && !cd.get('collapsed'))
                                cd.toggleChildren();
                        });
                    });
            };

            var updateCell = update.selectAll('td.' + rowName);
            updateCell.selectAll('span.' + rowName + '-indent').call(_indent);
            updateCell.selectAll('span.' + rowName + '-show-hide').call(_showHide);
            updateCell.selectAll('span.' + rowName + '-name').call(_name);
            updateCell.call(_collapseAll);

            var enterCell = enter.append('td').classed(rowName, true);
            enterCell.append('span').call(_indent);
            enterCell.append('span').classed(rowName + '-show-hide', true).call(_showHide);
            enterCell.append('span').classed(rowName + '-name', true).call(_name);
            enterCell.call(_collapseAll);

        }
    });
});