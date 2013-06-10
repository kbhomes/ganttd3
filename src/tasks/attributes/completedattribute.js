define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute({
                model: model,

                initialize: function() {
                    this.attributes['_completed'] = this.model.get('completed');
                },

                get: function() {
                    if (this.attributes['_completed'])
                        return this.attributes['_completed'];

                    if (this.model.get('group')) {
                        var children = this.model.get('tasks');
                        var comp = d3.mean(_.map(children, function(d) { return d.get('completed'); }));
                        return comp;
                    }
                    else {
                        if (!this.model.get('actStartDate')) {
                            return undefined;
                        }
                        else {
                            // If there's an end date, the project is completed (100%).
                            if (this.model.get('actEndDate')) {
                                return 100;
                            }
                            // Otherwise, show the manually entered completion.
                            else {
                                return this.attributes['_completed'];
                            }
                        }
                    }
                },

                set: function(value) {
                    this.attributes['_completed'] = value;
                }
            });
        }
    };
});