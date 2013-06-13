define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('completed', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('completed'));
                },

                get: function() {
                    var computed = this.compute();

                    if (typeof computed !== 'undefined')
                        return computed;
                    else
                        return this.getForcedValue();
                },

                compute: function() {
                    if (this.model.get('group')) {
                        var children = this.model.get('tasks');
                        var comp = d3.mean(_.map(children, function(d) { return d.get('completed'); }));
                        return comp;
                    }
                    else {
                        if (!this.model.get('actStartDate')) {
                            return undefined;
                        }
                        // If there's an end date, the project is completed (100%).
                        else if (this.model.get('actEndDate')) {
                            return 100;
                        }
                    }
                }
            });
        }
    };
});