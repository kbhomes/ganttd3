define(function(require) {
    var _ = require('underscore');

    return function ComputedAttribute(proto) {
        _.extend(this, proto);

        this.attributes = {};

        if (this.initialize)
            this.initialize.call(this);
    };
});