define(function(require) {
    var Task = require('tasks/task'),
        Backbone = require('backbone');

    // TaskCollection
    return Backbone.Collection.extend({
        model: Task
    });
});