define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute({
                model: model,

                initialize: function() {
                    this.attributes['_color'] = this.model.get('color');
                    this.attributes['_gantt'] = this.model.get('gantt');

                    if (this.attributes['_gantt'])
                        this.attributes['_settings'] = this.attributes['_gantt'].get('settings');
                },

                get: function() {
                    if (this.attributes['_color'])
                        return this.attributes['_color'];

                    if (this.attributes['_settings'] && typeof this.attributes['_settings'].colorGenerator == 'function')
                        return this.attributes['_settings'].colorGenerator(this.model);
                    else
                        return undefined;
                },

                set: function(value) {
                    this.attributes['_color'] = value;
                }
            });
        }
    };
});