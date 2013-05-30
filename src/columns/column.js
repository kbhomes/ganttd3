define(function(require) {
    var Base = require('base'),
        Task = require('tasks/task');

    // Column
    return Base.extend({
        defaults: {
            name: '',
            label: '',
            accessor: null
        },

        renderHeading: function(columns) {
            var colName = 'column-' + this.get('name');
            columns.append('td').classed(colName, true)
                .append('span')
                .text(this.get('label'));
        },

        render: function(selection) {
            var rowName = 'row-' + this.get('name');

            // The selection is the enter() selection so this does not need to be stored.
            var group = selection.append('td').classed(rowName, true);

            group.append('span')
                .text(this.get('accessor'))
                .style('font-weight', Task.prototype.method('getRowFontWeight'));
        },

        renderPopupData: function(table, data) {
            if (this.get('label') && this.get('accessor')) {
                var rowName = 'popup-row-' + this.get('name')
                var tr = table.append('tr').classed(rowName, true);

                // Append the label and data.
                tr.append('td').text(this.get('label') + ':');
                tr.append('td').text(this.get('accessor')(data));
            }
        }
    });
});