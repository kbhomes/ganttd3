define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute({
                model: model,

                initialize: function() {
                    this.attributes['_actStartDate'] = this.model.get('actStartDate');
                },

                get: function() {
                    if (this.attributes['_actStartDate'])
                        return this.attributes['_actStartDate'];

                    if (this.model.get('group'))
                        return d3.min(this.model.get('tasks'), function(t) { return t.get('actStartDate'); });
                    else
                        return this.attributes['_actStartDate'];
                },

                set: function(value) {
                    this.attributes['_actStartDate'] = value;
                }
            });
        }
    };
});