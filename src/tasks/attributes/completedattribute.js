define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('completed', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('completed'));
                },

                hasForcedValue: function() {
                    return (!this.model.get('group') && !this.model.get('actEndDate')) && typeof this.getAttribute('_force') !== 'undefined';
                },

                compute: function() {
                    if (this.model.get('group')) {
                        var children = this.model.get('tasks');
                        var comp = d3.mean(_.map(children, function(d) { return d.get('completed'); }));

                        if (comp.toFixed(0) == comp)
                            comp = comp.toFixed(0);
                        else
                            comp = comp.toFixed(1);

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