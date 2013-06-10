define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute({
                model: model,

                initialize: function() {
                    this.attributes['_estStartDate'] = this.model.get('estStartDate');
                },

                get: function() {
                    if (this.attributes['_estStartDate'])
                        return this.attributes['_estStartDate'];

                    if (this.model.get('group'))
                        return d3.min(this.model.get('tasks'), function(t) { return t.get('estStartDate'); });
                    else
                        return this.attributes['_estStartDate'];
                },

                set: function(value) {
                    this.attributes['_estStartDate'] = value;
                }
            });
        }
    };
});