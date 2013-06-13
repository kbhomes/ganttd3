define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('estEndDate', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('estEndDate'));
                },

                compute: function() {
                    if (this.model.get('group'))
                        return d3.max(this.model.get('tasks'), function(t) { return t.get('estEndDate'); });
                }
            });
        }
    };
});