define(function(require) {
    var _ = require('underscore');

    var ComputedAttribute = function(name, proto) {
        _.extend(this, proto);

        this.attributes = {
            '_name': name
        };

        if (this.initialize)
            this.initialize.call(this);
    }

    ComputedAttribute.prototype.get = function() {
        if (this.hasForcedValue())
            return this.getForcedValue();
        else
            return this.compute();
    };

    ComputedAttribute.prototype.set = function(value) {
        this.setAttribute('_force', value);
    };

    ComputedAttribute.prototype.hasForcedValue = function() {
        return typeof this.getAttribute('_force') !== 'undefined';
    }

    ComputedAttribute.prototype.getForcedValue = function() {
        return this.getAttribute('_force');
    }

    ComputedAttribute.prototype.compute = function() { };

    ComputedAttribute.prototype.getAttribute = function(name) {
        return this.attributes[name];
    }
    ComputedAttribute.prototype.setAttribute = function(name, value) {
        this.attributes[name] = value;
    };

    return ComputedAttribute;
});