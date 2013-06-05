define(function(require) {
    var Base = require('util/base'),
        Task = require('tasks/task');

    // Column
    return Base.extend({
        defaults: {
            name: '',
            label: '',
            accessor: null
        },

        getColumnName: function() {
            return 'column-' + this.get('name');
        },

        getRowName: function() {
            return 'row-' + this.get('name');
        },

        renderHeading: function(columns) {
            var colName = this.getColumnName();
            columns.append('td').classed(colName, true)
                .append('span')
                .text(this.get('label'));
        },

        render: function(selection) {
            var rowName = this.getRowName();

            // The selection is the enter() selection so this does not need to be stored.
            var group = selection.append('td').classed(rowName, true);

            group.append('span')
                .text(this.get('accessor'))
                .style('font-weight', Task.prototype.method('getRowFontWeight'));
        },

        renderPopupData: function(table, data) {
            if (this.get('label') && this.get('accessor')) {
                var rowName = 'popup-' + this.getRowName();
                var tr = table.append('tr').classed(rowName, true);

                // Append the label and data.
                tr.append('td').text(this.get('label') + ':');
                tr.append('td').text(this.get('accessor')(data));
            }
        }
    });
});