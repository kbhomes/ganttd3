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

        render: function(update, enter) {
            var rowName = this.getRowName();
            var accessor = this.get('accessor');

            var _column = function(sel) {
                sel.text(accessor);
            };

            var updateCell = update.selectAll('td.' + rowName);
            updateCell.call(_column);

            var enterCell = enter.append('td').classed(rowName, true);
            enterCell.append('span').call(_column);
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