define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('estStartDate', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('estStartDate'));
                },

                compute: function() {
                    if (this.model.get('group'))
                        return d3.min(this.model.get('tasks'), function(t) { return t.get('estStartDate'); });
                }
            });
        }
    };
});