define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute({
                model: model,

                initialize: function() {
                    this.attributes['_actEndDate'] = this.model.get('actEndDate');
                },

                get: function() {
                    if (this.attributes['_actEndDate'])
                        return this.attributes['_actEndDate'];

                    if (this.model.get('group')) {
                        if (_.every(this.model.get('tasks'), function(t) { return t.get('actEndDate'); }))
                            return d3.max(this.model.get('tasks'), function(t) { return t.get('actEndDate'); });
                        else
                            return undefined;
                    }
                    else
                        return this.attributes['_actEndDate'];
                },

                set: function(value) {
                    this.attributes['_actEndDate'] = value;
                }
            });
        }
    };
});