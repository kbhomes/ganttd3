define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute({
                model: model,

                get: function() {
                    return this.attributes['_group'] || this.model.get('tasks').length > 0;
                },

                set: function(value) {
                    this.attributes['_group'] = value;
                }
            });
        }
    };
});