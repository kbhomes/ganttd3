define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('actStartDate', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('actStartDate'));
                },

                compute: function() {
                    if (this.model.get('group'))
                        return d3.min(this.model.get('tasks'), function(t) { return t.get('actStartDate'); });
                }
            });
        }
    };
});