define(function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('color', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('color'));

                    this.setAttribute('_gantt', this.model.get('gantt'));

                    if (this.getAttribute('_gantt'))
                        this.setAttribute('_settings', this.getAttribute('_gantt').get('settings'));
                },

                compute: function() {
                    if (this.getAttribute('_settings') && typeof this.getAttribute('_settings').colorGenerator == 'function')
                        return this.getAttribute('_settings').colorGenerator(this.model);
                }
            });
        }
    };
});