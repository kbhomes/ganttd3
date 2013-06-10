define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute({
                model: model,

                initialize: function() {
                    this.attributes['_estEndDate'] = this.model.get('estEndDate');
                },

                get: function() {
                    if (this.attributes['_estEndDate'])
                        return this.attributes['_estEndDate'];

                    if (this.model.get('group'))
                        return d3.max(this.model.get('tasks'), function(t) { return t.get('estEndDate'); });
                    else
                        return this.attributes['_estEndDate'];
                },

                set: function(value) {
                    this.attributes['_estEndDate'] = value;
                }
            });
        }
    };
});