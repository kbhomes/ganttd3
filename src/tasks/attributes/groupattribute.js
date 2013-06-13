define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('group', {
                model: model,

                compute: function() {
                    return this.model.get('tasks').length > 0;
                }
            });
        }
    };
});