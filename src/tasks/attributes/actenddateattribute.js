define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('actEndDate', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('actEndDate'));
                },

                compute: function() {
                    if (this.model.get('group')) {
                        if (_.every(this.model.get('tasks'), function(t) { return t.get('actEndDate'); }))
                            return d3.max(this.model.get('tasks'), function(t) { return t.get('actEndDate'); });
                    }
                }
            });
        }
    };
});