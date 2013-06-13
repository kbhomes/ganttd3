/**
 * A base class that provides methods useful for callbacks.
 */
define(function(require) {
    var Backbone = require('backbone'),
        ComputedAttribute = require('util/computedattribute');

    // Base
    return Backbone.Model.extend({

        /**
         * A helper that creates a function to obtain a given attribute of a model instance. Useful
         * as a callback that expects a model instance.
         *
         * <code>
         * var Secret = Base.extend({ ... });
         * var accessor = Secret.prototype.accessor('pin');
         *
         * var secrets = [new Secret({ pin: '1234' }), new Secret({ pin: '5678' }), new Secret({ pin: '9999' })];
         * var pins = secrets.map(accessor);
         * // pins = ["1234", "5678", "9999"];
         * </code>
         *
         * @param {string} arg The name of the attribute.
         * @returns {function} A callable function that returns the value of the named attribute of a given model instance.
         */
        accessor: function(arg) {
            return function(thisArg) {
                return thisArg.get.call(thisArg, arg);
            };
        },

        /**
         * A helper that creates a function to obtain the result of a given method of a model instance. Useful
         * as a callback that expects a model instance. Any additional parameters to this function and to
         * the returned function will be passed, in order, to the specified method of the model.
         *
         * <code>
         * var Task = Base.extend({
     *     getPercentCompletion: function() {
     *         return Math.floor(this.get('completion') * 100).toFixed(0) + '%';
     *     }
     * });
         * var method = Task.prototype.method('getPercentCompletion');
         *
         * var tasks = [new Task({ completion: 0.53 }), new Task({ completion: 1 }), new Task({ completion: 0.75 })];
         * var progress = tasks.map(method);
         * // progress = ["53%", "100%", "75%"];
         * </code>
         *
         * @param {string} method The name of the method.
         * @returns {function} A callable function that returns the result of the named method of a given model instance.
         */
        method: function(method) {
            var args1 = Array.prototype.slice.call(arguments, 1);
            return function(thisArg) {
                var args2 = Array.prototype.slice.call(arguments, 1);
                return thisArg[method].apply(thisArg, args1.concat(args2));
            };
        },

        get: function(attr, raw) {
            var value = Backbone.Model.prototype.get.call(this, attr);

            if (value instanceof ComputedAttribute && !raw) {
                return value.get();
            }
            else {
                return value;
            }
        },

        set: function(attr, value) {
            var target = Backbone.Model.prototype.get.call(this, attr);

            if (target instanceof ComputedAttribute) {
                target.set(value);
            }
            else {
                Backbone.Model.prototype.set.call(this, attr, value);
            }
        }
    });
});