(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.GanttD3 = factory();
    }
}(this, function () {

/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../lib/almond", function(){});

define('underscore',[],function () {
    return _;
});
define('backbone',[],function () {
    return Backbone;
});
define('util/computedattribute',['require','underscore'],function(require) {
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
/**
 * A base class that provides methods useful for callbacks.
 */
define('util/base',['require','backbone','util/computedattribute'],function(require) {
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
define('d3',[],function () {
    return d3;
});
define('util/util',['require','d3','underscore'],function(require) {
    var d3 = require('d3'),
        _ = require('underscore');

    return {

        /**
         * Adds 'px' to the end of the input string or function result.
         *
         * @param {string|function} arg A string, or a function that returns a string,
         *     to append 'px' to.
         * @return {string}
         */
        plusPx: function(arg) {
            var inner = function(str) {
                return str + 'px';
            };
            if (_.isFunction(arg))
                return _.compose(inner, arg);
            else
                return inner(arg);
        },

        /**
         * Returns a copy of an array where each item returns a truth-y value when passed
         * to the accessor function, or who has a truth-y attribute named by accessor.
         *
         * @param {array} data
         * @param {string|function} accessor
         * @returns {array}
         */
        accessorFilter: function(data, accessor) {
            return _.filter(data, function(d) {
                if (_.isFunction(accessor))
                    return accessor(d);
                else
                    return d.get(accessor);
            })
        },

        fullDateFormat: d3.time.format('%Y-%m-%d')
    };
});
define('tasks/attributes/groupattribute',['require','util/computedattribute'],function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('group', {
                model: model,

                compute: function() {
                    return this.model.get('tasks').length > 0;
                }
            });
        }
    };
});
define('tasks/attributes/eststartdateattribute',['require','util/computedattribute'],function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('estStartDate', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('estStartDate'));
                },

                compute: function() {
                    if (this.model.get('group'))
                        return d3.min(this.model.get('tasks'), function(t) { return t.get('estStartDate'); });
                }
            });
        }
    };
});
define('tasks/attributes/estenddateattribute',['require','util/computedattribute'],function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('estEndDate', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('estEndDate'));
                },

                compute: function() {
                    if (this.model.get('group'))
                        return d3.max(this.model.get('tasks'), function(t) { return t.get('estEndDate'); });
                }
            });
        }
    };
});
define('tasks/attributes/actstartdateattribute',['require','util/computedattribute'],function(require) {
    var ComputedAttribute = require('util/computedattribute');

    return {
        create: function(model) {
            return new ComputedAttribute('actStartDate', {
                model: model,

                initialize: function() {
                    this.set(this.model.get('actStartDate'));
                },

                compute: function() {
                    if (this.model.get('group'))
                        return d3.min(this.model.get('tasks'), function(t) { return t.get('actStartDate'); });
                }
            });
        }
    };
});
define('tasks/attributes/actenddateattribute',['require','util/computedattribute'],function(require) {
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
define('tasks/attributes/colorattribute',['require','util/computedattribute'],function(require) {
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
define('tasks/attributes/completedattribute',['require','util/computedattribute'],function(require) {
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
define('tasks/task',['require','util/base','util/util','util/computedattribute','tasks/attributes/groupattribute','tasks/attributes/eststartdateattribute','tasks/attributes/estenddateattribute','tasks/attributes/actstartdateattribute','tasks/attributes/actenddateattribute','tasks/attributes/colorattribute','tasks/attributes/completedattribute','d3','underscore','backbone'],function(require) {
    var Base = require('util/base'),
        Util = require('util/util'),

        ComputedAttribute = require('util/computedattribute'),
        GroupAttribute = require('tasks/attributes/groupattribute'),
        EstStartDateAttribute = require('tasks/attributes/eststartdateattribute'),
        EstEndDateAttribute = require('tasks/attributes/estenddateattribute'),
        ActStartDateAttribute = require('tasks/attributes/actstartdateattribute'),
        ActEndDateAttribute = require('tasks/attributes/actenddateattribute'),
        ColorAttribute = require('tasks/attributes/colorattribute'),
        CompletedAttribute = require('tasks/attributes/completedattribute'),

        d3 = require('d3'),
        _ = require('underscore'),
        Backbone = require('backbone');

    // Task
    return Base.extend({
        defaults: {
            id: '',
            name: '',
            estStartDate: undefined,
            estEndDate: undefined,
            actStartDate: undefined,
            actEndDate: undefined,
            completed: 0.00,
            collapsed: false,
            visible: true
        },

        initialize: function() {
            this.set('tasks', []);

            var gantt, settings;
            var pathSeparator = '/';

            if (this.get('gantt')) {
                gantt = this.get('gantt');
                settings = gantt.get('settings');
                pathSeparator = settings.pathSeparator;
            }

            // Parse an ID path into its components.
            var path = this.get('id').split(pathSeparator);
            var pathName = path.pop();

            this.set('path', path)
            this.set('pathName', pathName);

            this.initializeComputedProperties(settings);
        },

        initializeComputedProperties: function(settings) {
            this.set('group', GroupAttribute.create(this));
            this.set('estStartDate', EstStartDateAttribute.create(this));
            this.set('estEndDate', EstEndDateAttribute.create(this));
            this.set('actStartDate', ActStartDateAttribute.create(this));
            this.set('actEndDate', ActEndDateAttribute.create(this));
            this.set('color', ColorAttribute.create(this));
            this.set('completed', CompletedAttribute.create(this));
        },

        getEstDuration: function() {
            if (!this.get('estStartDate') || !this.get('estEndDate'))
                return '';

            var days = ((this.get('estEndDate') - this.get('estStartDate')) / (1000 * 60 * 60 * 24) + 1);
            return days + (days == 1 ? ' day' : ' days');
        },

        getPercentCompletion: function() {
            if (this.get('completed')) {
                return this.get('completed') + '%';
            }
            else
                return '';
        },

        getFormattedDate: function(name) {
            var date = this.get(name);

            if (date)
                return Util.fullDateFormat(date);
            else
                return '';
        },

        getBarColor: function() {
            return this.get('color').bar;
        },

        getBarHeight: function() {
            var settings = this.get('gantt').get('settings');

            if (this.get('group'))
                return settings.groupHeight;
            else
                return settings.barHeight;
        },

        getBarCompletionTop: function() {
            var settings = this.get('gantt').get('settings');

            if (this.get('group'))
                return ((settings.groupHeight - settings.groupCompletionHeight) / 2);
            else
                return ((settings.barHeight - settings.barCompletionHeight) / 2);
        },

        getBarCompletionHeight: function() {
            var settings = this.get('gantt').get('settings');

            if (this.get('group') || !this.get('parent'))
                return settings.groupCompletionHeight;
            else
                return settings.barCompletionHeight;
        },

        getBarCompletionColor: function() {
            return this.get('color').completion;
        },

        getRowHidden: function() {
            if (this.get('collapsed'))
                return '+';
            else
                return '\u2013'; // en-dash (–)
        },

        getIndentClass: function() {
            return 'indent' + this.get('path').length;
        },

        getRowFontWeight: function() {
            return this.get('group') ? 'bold' : 'normal';
        },

        getChildren: function(directOnly) {
            var ret = {};
            ret.children = this.get('tasks');

            if (!directOnly) {
                ret.descendants = ret.children.map(function(cd) {
                   return cd.getChildren();
                });
            }

            return ret;
        },

        toggleChildren: function(first, descendants, show) {
            if (!this.has('gantt'))
                return;

            var gantt = this.get('gantt');

            var collapsed = this.get('collapsed');
            var target = collapsed;
            var children;

            if (first === undefined) {
                first = true;
            }

            if (first == false) {
                if (descendants === undefined)
                    return;

                target = show;
                children = descendants;
            }
            else {
                this.set('collapsed', !collapsed);
                children = this.getChildren();
            }

            if (children) {
                _.each(children.children, function(cd, ci) {
                    cd.set('visible', target);

                    if (cd.get('group') && !cd.get('collapsed')) {
                        cd.toggleChildren(false, children.descendants[ci], target);
                    }
                });
            }
        },

        toString: function() {
            return 'Task ' + this.get('id');
        }
    });
});
define('tasks/taskcollection',['require','tasks/task','backbone'],function(require) {
    var Task = require('tasks/task'),
        Backbone = require('backbone');

    // TaskCollection
    return Backbone.Collection.extend({
        model: Task
    });
});
define('columns/column',['require','util/base','tasks/task'],function(require) {
    var Base = require('util/base'),
        Task = require('tasks/task');

    // Column
    return Base.extend({
        defaults: {
            name: '',
            label: '',
            accessor: null
        },

        getColumnName: function() {
            return 'column-' + this.get('name');
        },

        getRowName: function() {
            return 'row-' + this.get('name');
        },

        renderHeading: function(columns) {
            var colName = this.getColumnName();
            columns.append('td').classed(colName, true)
                .append('span')
                .text(this.get('label'));
        },

        render: function(update, enter) {
            var rowName = this.getRowName();
            var accessor = this.get('accessor');

            var _column = function(sel) {
                sel.text(accessor);
            };

            var updateCell = update.selectAll('td.' + rowName);
            updateCell.selectAll('span').call(_column);

            var enterCell = enter.append('td').classed(rowName, true);
            enterCell.append('span').call(_column);
        },

        renderPopupData: function(table, data) {
            if (this.get('label') && this.get('accessor')) {
                var rowName = 'popup-' + this.getRowName();
                var tr = table.append('tr').classed(rowName, true);

                // Append the label and data.
                tr.append('td').text(this.get('label') + ':');
                tr.append('td').text(this.get('accessor')(data));
            }
        }
    });
});
define('columns/tasknamecolumn',['require','columns/column','tasks/task','underscore'],function(require) {
    var Column = require('columns/column'),
        Task = require('tasks/task'),
        _ = require('underscore');

    // TaskNameColumn
    return Column.extend({

        initialize: function() {
            this.set('name', 'name');
        },

        render: function(update, enter) {
            var rowName = this.getRowName();
            var gantt = this.get('gantt');
            var settings = gantt.get('settings');

            var _indent = function(sel) {
                sel.attr('class', Task.prototype.method('getIndentClass'))
                    .classed(rowName + '-indent', true);
            };

            var _showHide = function(sel) {
                sel.text(Task.prototype.method('getRowHidden'))
                    .style('visibility', 'hidden')
                    .filter(Task.prototype.accessor('group'))
                    .style('visibility', 'visible')
                    .on('click', function(d,i) {
                        d.toggleChildren();
                        gantt.redraw();
                    });
            };

            var _name = function(sel) {
                sel.text(Task.prototype.accessor('name'))
                    .attr('title', function(d) {
                        if (d.get('description'))
                            return d.get('description');
                        else
                            return d.get('name');
                    })
                    .on('click', function(d,i) {
                        if (settings.linkCallback)
                            settings.linkCallback.call(this, d, i);
                    });
            };

            var _collapseAll = function(sel) {
                var filtered =
                    sel
                        .filter(Task.prototype.accessor('group'))
                        .filter(function(d,i) {
                            return _.some(d.get('tasks'), Task.prototype.accessor('group'));
                        });

                // Remove the links that are already there (if this is the enter selection, there will be no links).
                filtered.selectAll('a').remove();

                // Add the links (if this is the update selection, the links will be added back in);
                filtered.append('a').classed(rowName + '-collapse-all', true)
                    .text('[collapse all]')
                    .on('click', function(d,i) {
                        _.each(d.get('tasks'), function(cd,ci) {
                            if (cd.get('group') && !cd.get('collapsed'))
                                cd.toggleChildren();
                        });
                        gantt.redraw();
                    });
            };

            var updateCell = update.selectAll('td.' + rowName);
            updateCell.selectAll('span.' + rowName + '-indent').call(_indent);
            updateCell.selectAll('span.' + rowName + '-show-hide').call(_showHide);
            updateCell.selectAll('span.' + rowName + '-name').call(_name);
            updateCell.call(_collapseAll);

            var enterCell = enter.append('td').classed(rowName, true);
            enterCell.append('span').call(_indent);
            enterCell.append('span').classed(rowName + '-show-hide', true).call(_showHide);
            enterCell.append('span').classed(rowName + '-name', true).call(_name);
            enterCell.call(_collapseAll);

        }
    });
});
define('columns/taskbarscolumn',['require','columns/column','tasks/task','util/util','d3','underscore'],function(require) {
    var Column = require('columns/column'),
        Task = require('tasks/task'),
        Util = require('util/util'),
        d3 = require('d3'),
        _ = require('underscore');

    // TaskBarsColumn
    return Column.extend({

        initialize: function() {
            this.set('name', 'bars')
        },

        renderHeading: function() { },

        render: function(update, enter) {
            var rowName = this.getRowName();
            var settings = this.get('gantt').get('settings');

            var _bars = function(sel) {
            };

            var _estBars = function(sel, scale) {
                sel.style('left', function(d,i) { return scale(d) + 'px'; })
                    .style('top', function(d,i) { return ((settings.rowHeight - settings.barHeight * 2) / 2 - 2) + 'px'; });
            };

            var _estBarsFull = function(sel, scale) {
                sel.style('height', Util.plusPx(Task.prototype.method('getBarHeight')))
                    .style('width', function(d,i) { return Math.floor(scale(d))  + 'px'; })
                    .style('background-color', Task.prototype.method('getBarColor'));
            };

            var _estBarsCompleted = function(sel, scale) {
                sel.style('top', Util.plusPx(Task.prototype.method('getBarCompletionTop')))
                    .style('height', Util.plusPx(Task.prototype.method('getBarCompletionHeight')))
                    .style('width', function(d,i) { return Math.floor(scale(d) * (d.get('completed') / 100)) + 'px'; })
                    .style('background-color', Task.prototype.method('getBarCompletionColor'));
            };

            var _actBars = function(sel, scale) {
                sel.style('left', function(d,i) { return scale(d) + 'px'; })
                    .style('top', function(d,i) { return ((settings.rowHeight - settings.barHeight * 2) / 2 + settings.barHeight - 1) + 'px'; });
            };

            var _actBarsFull = function(sel, scale) {
                sel.style('height', Util.plusPx(Task.prototype.method('getBarHeight')))
                    .style('width', function(d,i) { return Math.floor(scale(d))  + 'px'; })
                    .style('background-color', d3.rgb("#AAA").toString());
            };

            var _actBarsCompleted = function(sel, scale) {
                sel.style('top', Util.plusPx(Task.prototype.method('getBarCompletionTop')))
                    .style('height', Util.plusPx(Task.prototype.method('getBarCompletionHeight')))
                    .style('width', function(d,i) { return Math.floor(scale(d) * (d.get('completed') / 100)) + 'px'; })
                    .style('background-color', d3.rgb("#AAA").darker().toString());
            };

//            if (enter.length) {
//                // There is new data coming in, so remove all the date ranges,
//                // day cells, and bars. We'll be adding that again later.
//                d3.selectAll('td.date-range').remove();
//                d3.selectAll('td.day-cell').remove();
//                d3.selectAll('td.' + rowName).remove();
//            }
//
            var selection = d3.select('table').selectAll('tr.row');
            var data = selection.data();

            var interval = settings.interval;

            if (data.length == 0)
                return;

            // This scale is for computing the positions/widths of the bars.
            var min = Math.min.apply(Math, _.filter([interval.getMinGroup(data, 'estStartDate'), interval.getMinGroup(data, 'actStartDate')], _.identity))
            var max = Math.max.apply(Math, _.filter([interval.getMaxGroup(data, 'estEndDate'), interval.getMaxGroup(data, 'actEndDate')], _.identity));

            var domain = [min, max];
            interval.setDomain(domain);

            var unitSteps = interval.getUnitSteps();
            var groupSteps = interval.getGroupSteps();
            var maxWidth = unitSteps.length * interval.get('unitWidth');
            interval.setRange([0, maxWidth]);

            var scaleX = interval.getXScale();
            var scaleWidth = interval.getWidthScale();

            var ranges = d3.select('tr.date-ranges').selectAll('td.date-range').data(groupSteps, _.identity);
            var columns = d3.select('tr.columns').selectAll('td.day-cell').data(unitSteps, _.identity);

            // Update selection
            {
                // Create a cell to span the whole bars area.
                var cell = update.selectAll('td.' + rowName).attr('colspan', unitSteps.length);
                var group = cell.selectAll('div.' + rowName + '-container');
                var overlay = group.selectAll('div.overlay');
                var bars = group.selectAll('div.' + rowName + '-bars');

                // Create the bars that represent the estimated completion dates.
                var estScaleX = function(d) { return scaleX(d.get('estStartDate')); };
                var estScaleWidth = function(d) { return scaleWidth(d.get('estStartDate'), d.get('estEndDate')); };

                // Remove estimate date bars if either estStartDate or estEndDate don't exist.
                bars.selectAll('div.bar.' + rowName + '-est').filter(function(d) { return !d.get('estStartDate') || !d.get('estEndDate'); }).remove();

                var estBars = bars
                    .filter(function(d) { return d.get('estStartDate') && d.get('estEndDate'); })
                    .selectAll('div.bar.' + rowName + '-est')
                    .call(_estBars, estScaleX);

                var estBarsFull = estBars
                    .selectAll('div.' + rowName + '-est-full')
                    .call(_estBarsFull, estScaleWidth);

                var estBarsCompleted = estBars
                    .selectAll('div.' + rowName + '-est-completed')
                    .call(_estBarsCompleted, estScaleWidth);

                // Create the bars that represent the actual completion dates.
                var actScaleX = function(d) { return scaleX(d.get('actStartDate')); };
                var actScaleWidth = function(d) { return scaleWidth(d.get('actStartDate'), d.get('actEndDate')); };

                // Remove actual date bars if either actStartDate or actEndDate don't exist.
                bars.selectAll('div.bar.' + rowName + '-act').filter(function(d) { return !d.get('actStartDate') || !d.get('actEndDate'); }).remove();

                var actBars = bars
                    .filter(function(d) { return d.get('actStartDate') && d.get('actEndDate'); })
                    .selectAll('div.bar.' + rowName + '-act')
                    .call(_actBars, actScaleX);

                var actBarsFull = actBars
                    .selectAll('div.' + rowName + '-act-full')
                    .call(_actBarsFull, actScaleWidth);

                var actBarsCompleted = actBars
                    .selectAll('div.' + rowName + '-act-completed')
                    .call(_actBarsCompleted, actScaleWidth);
            };

            // Enter selection
            {
                // Create a cell to span the whole bars area.
                var cell = enter.append('td')
                    .classed(rowName, true)
                    .attr('colspan', unitSteps.length);

                var group = cell.append('div')
                    .classed(rowName + '-container', true)
                    .classed('group', Task.prototype.accessor('group'));

                var overlay = group.append('div').classed('overlay', true);

                var bars = group.append('div')
                    .classed(rowName + '-bars', true)
                    .on('mousemove', this.displayPopup(this))
                    .on('mouseout', this.hidePopup);

                // Create the bars that represent the estimated completion dates.
                var estScaleX = function(d) { return scaleX(d.get('estStartDate')); };
                var estScaleWidth = function(d) { return scaleWidth(d.get('estStartDate'), d.get('estEndDate')); };

                var estBars = bars
                    .filter(function(d) { return d.get('estStartDate') && d.get('estEndDate'); })
                    .append('div')
                    .classed(rowName + '-est', true)
                    .classed('bar', true)
                    .call(_estBars, estScaleX);

                var estBarsFull = estBars
                    .append('div')
                    .classed(rowName + '-est-full', true)
                    .call(_estBarsFull, estScaleWidth);

                var estBarsCompleted = estBars
                    .append('div')
                    .classed(rowName + '-est-completed', true)
                    .call(_estBarsCompleted, estScaleWidth);

                // Create the bars that represent the actual completion dates.
                var actScaleX = function(d) { return scaleX(d.get('actStartDate')); };
                var actScaleWidth = function(d) { return scaleWidth(d.get('actStartDate'), d.get('actEndDate')); };

                var actBars = bars
                    .filter(function(d) { return d.get('actStartDate') && d.get('actEndDate'); })
                    .append('div')
                    .classed(rowName + '-act', true)
                    .classed('bar', true)
                    .call(_actBars, actScaleX);

                var actBarsFull = actBars
                    .append('div')
                    .classed(rowName + '-act-full', true)
                    .call(_actBarsFull, actScaleWidth);

                var actBarsCompleted = actBars
                    .append('div')
                    .classed(rowName + '-act-completed', true)
                    .call(_actBarsCompleted, actScaleWidth);
            };

            // Update the date ranges.
            var rangesUpdate = ranges.call(_.bind(interval.appendGroupCell, interval));
            var rangesExit = ranges.exit().remove();
            var rangesEnter = ranges.enter().append('td').call(_.bind(interval.appendGroupCell, interval));
            ranges.order();

            // Update the date columns.
            var columnsUpdate = columns
                .select('div.inner')
                .style('width', Util.plusPx(interval.get('unitCellWidth')))
                .select('div.background')
                .style('background-color', _.bind(interval.getUnitBackgroundColor, interval))
                .style('width', Util.plusPx(interval.get('unitCellWidth')))
                .text(_.bind(interval.getUnitText, interval));

            // Remove the exiting columns.
            var columnsExit = columns.exit().remove();

            // The date columns enter selection.
            var columnsEnter = columns.enter()
                .append('td')
                .classed('day-cell', true)
                    .append('div')
                    .classed('inner', true)
                    .style('width', Util.plusPx(interval.get('unitCellWidth')))
                        .append('div')
                        .classed('background', true)
                        .style('background-color', _.bind(interval.getUnitBackgroundColor, interval))
                        .style('width', Util.plusPx(interval.get('unitCellWidth')))
                        .text(_.bind(interval.getUnitText, interval));

            // Reorder the columns.
            columns.order();

//            _.each(steps, function(d,i) {
//                interval.appendGroupCell(d, i, ranges);
//
//                var cols = d3.select('tr.columns');
//                var background = interval.getUnitBackgroundColor(d,i);
//
//                var colCells = cols.append('td').classed('day-cell', true);
//                var colDivs = colCells.append('div').classed('inner', true).style('width', Util.plusPx(interval.get('unitCellWidth')));
//                var colDays = colDivs.append('div')
//                    .classed('background', true)
//                    .style('background-color', background)
//                    .style('width', Util.plusPx(interval.get('unitCellWidth')))
//                    .text(interval.getUnitText(d));
//            });
        },

        displayPopup: function(model) {
            var g = model.get('gantt');

            return function(d,i) {
                var e = d3.event;
                var m = [(e.pageX || e.clientX) + 5, (e.pageY || e.clientY) + 5]; // IE fix.

                var popup = d3.select('.taskpopup');
                popup.select('.corner').style('border-right-color', d.getBarColor().toString());
                popup.select('.taskname').text(d.get('name'));

                var table = popup.select('table.taskdata');

                // IE doesn't allow you to set innerHTML of table elements.
                if (typeof 'aight' !== 'undefined') {
                    var node = table.node();

                    while (node.hasChildNodes()) {
                        node.removeChild(node.lastChild);
                    }
                }
                else {
                    table.html('');
                }

                _.each(g.get('columns'), function(c) {
                    c.renderPopupData(table, d);
                });

                popup.style('display', 'block');

                // Figure out if this popup is extending past the edge of the window and needs to be relocated.
                var width = popup.node().clientWidth;
                var height = popup.node().clientHeight;
                var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

                if (e.clientX + width + 30 > windowWidth)
                    m[0] -= width + 10;
                if (e.clientY + height + 30 > windowHeight)
                    m[1] -= height + 10;

                popup.style('left', m[0] + 'px')
                    .style('top', m[1] + 'px');
            };
        },

        hidePopup: function() {
            d3.select('.taskpopup').style('display', 'none');
        }
    });
});
define('intervals/interval',['require','util/base','d3','underscore'],function(require) {
    var Base = require('util/base'),
        d3 = require('d3'),
        _ = require('underscore');

    // Interval
    return Base.extend({
        defaults: {
            name: '',
            unitWidth: 20,
            unitCellWidth: 19,
            unitFormat: d3.time.format('%-d'),
            unitInterval: d3.time.day,
            groupInterval: d3.time.week
        },

        getUnitBackgroundColor: function(d,i) { },

        getMinGroup: function(data, accessor) { },

        getMaxGroup: function(data, accessor) { },

        setDomain: function(domain) {
            this.set('domain', domain);
        },

        setRange: function(range) {
            this.set('range', range);
        },

        getUnitSteps: function() {
            return this.get('unitInterval').range.apply(undefined, this.get('domain'));
        },

        getGroupSteps: function() {
            return this.get('groupInterval').range.apply(undefined, this.get('domain'));
        },

        getGroupText: function(start) { },

        appendGroupCell: function(sel) { },

        getUnitText: function(date) { },

        getXScale: function() {
            var scale = d3.time.scale()
                .domain(this.get('domain'))
                .rangeRound(this.get('range'));

            return scale;
        },

        getWidthScale: function() {
            var scale = this.getXScale();
            var correct = this.correctDate;

            return function(start, end) {
                return scale(correct(end)) - scale(start);
            }
        },

        // Used to add one day to the input. This is done because a
        // task that ends on a certain day should be shown as filling
        // that whole day on the Gantt chart.
        correctDate: function(arg) {
            var inner = function(date) {
                return d3.time.day.offset(date, 1);
            };
            if (_.isFunction(arg))
                return _.compose(inner, arg);
            else
                return inner(arg);
        }
    });
});
define('intervals/dayinterval',['require','intervals/interval','util/base','util/util','d3','underscore'],function(require) {
    var Interval = require('intervals/interval'),
        Base = require('util/base'),
        Util = require('util/util'),
        d3 = require('d3'),
        _ = require('underscore');

    // DayInterval
    return Interval.extend({
        defaults: {
            name: 'day',
            unitWidth: 20,
            unitCellWidth: 19,
            unitFormat: d3.time.format('%-d'),
            unitInterval: d3.time.day,
            groupInterval: d3.time.week
        },

        getMinGroup: function(data, accessor) {
            var group = this.get('groupInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return group.floor(d3.min(filtered, funcAccessor));
            else
                return null;
        },

        getMaxGroup: function(data, accessor) {
            var group = this.get('groupInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return group.ceil(d3.max(filtered, funcAccessor));
            else
                return null;
        },

        getUnitBackgroundColor: function(d,i) {
            var unit = this.get('unitInterval');

            // Today or not.
            if (unit.floor(d).getTime() == unit.floor(new Date()).getTime()) {
                return '#dbd';
            }
            else {
                // Beginning or the end of the week.
                if ((i % 7) == 0 || (i % 7) == 6)
                    return '#eee';
                else
                    return '';
            }
        },

        getGroupText: function(start) {
            return Util.fullDateFormat(start) + ' to ' + Util.fullDateFormat(this.get('unitInterval').offset(start, 6));
        },

        appendGroupCell: function(sel) {
            // Append a date range for the week to ranges row.
            sel.classed('date-range', true)
                .attr('colspan', 7)
                .text(_.bind(this.getGroupText, this));
        },

        getGroupSteps: function() {
            return _.filter(this.get('unitInterval').range.apply(undefined, this.get('domain')), function(d,i) {
                return i % 7 == 0;
            });
        },

        getUnitText: function(date) {
            return this.get('unitFormat')(date);
        }
    });
});
define('intervals/weekinterval',['require','intervals/interval','util/base','util/util','d3'],function(require) {
    var Interval = require('intervals/interval'),
        Base = require('util/base'),
        Util = require('util/util'),
        d3 = require('d3');

    // WeekInterval
    return Interval.extend({
        defaults: {
            name: 'week',
            unitWidth: 40,
            unitCellWidth: 39,
            unitFormat: d3.time.format('%-m/%-d'),
            unitInterval: d3.time.week,
            groupInterval: d3.time.year
        },

        getMinGroup: function(data, accessor) {
            var unit = this.get('unitInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return unit.floor(d3.min(filtered, funcAccessor));
            else
                return null;
        },

        getMaxGroup: function(data, accessor) {
            var unit = this.get('unitInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return unit.ceil(d3.max(filtered, funcAccessor));
            else
                return null;
        },

        getUnitBackgroundColor: function(d,i) {
            var unit = this.get('unitInterval');

            // This week or not.
            if (unit.floor(d).getTime() == unit.floor(new Date()).getTime()) {
                return '#dbd';
            }
            else {
                return '';
            }
        },

        getGroupText: function(start) {
            return start.getFullYear();
        },

        appendGroupCell: function(sel) {
            // Append a year for every week.
            sel.classed('date-range', true)
                .attr('colspan', undefined)
                .text(this.getGroupText);
        },

        getGroupSteps: function() {
            return this.getUnitSteps();
        },

        getUnitText: function(date) {
            return this.get('unitFormat')(date);
        }
    });
});
define('intervals/monthinterval',['require','intervals/interval','util/base','util/util','d3'],function(require) {
    var Interval = require('intervals/interval'),
        Base = require('util/base'),
        Util = require('util/util'),
        d3 = require('d3');

    // MonthInterval
    return Interval.extend({
        defaults: {
            name: 'month',
            unitWidth: 60,
            unitCellWidth: 59,
            unitFormat: d3.time.format('%b'),
            unitInterval: d3.time.month,
            groupInterval: d3.time.year
        },

        getMinGroup: function(data, accessor) {
            var unit = this.get('unitInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return unit.floor(d3.min(filtered, funcAccessor));
            else
                return null;
        },

        getMaxGroup: function(data, accessor) {
            var unit = this.get('unitInterval');
            var filtered = Util.accessorFilter(data, accessor);
            var funcAccessor = Base.prototype.accessor(accessor);

            if (filtered.length)
                return unit.ceil(d3.max(filtered, funcAccessor));
            else
                return null;
        },

        getUnitBackgroundColor: function(d,i) {
            var unit = this.get('unitInterval');

            // This month or not.
            if (unit.floor(d).getTime() == unit.floor(new Date()).getTime()) {
                return '#dbd';
            }
            else {
                return '';
            }
        },

        getGroupText: function(start) {
            return start.getFullYear();
        },

        appendGroupCell: function(sel) {
            // Append a year for every week.
            sel.classed('date-range', true)
                .attr('colspan', undefined)
                .text(this.getGroupText);
        },

        getGroupSteps: function() {
            return this.getUnitSteps();
        },

        getUnitText: function(date) {
            return this.get('unitFormat')(date);
        }
    });
});
define('util/colors',['require','d3'],function(require) {
    var d3 = require('d3');

    var _brights = ['#ff00ff', '#00ff00', '#0000ff', '#ff0000', '#669900', '#6600ff', '#996633', '#0ffff0', '#ffcc00', '#ffff00'];

    return {
        brights: d3.scale.ordinal().range(_brights),
        lights: d3.scale.category10()
    };
});
define('ganttd3',['require','backbone','util/base','tasks/task','tasks/taskcollection','columns/column','columns/tasknamecolumn','columns/taskbarscolumn','intervals/dayinterval','intervals/weekinterval','intervals/monthinterval','util/colors','d3','underscore'],function(require) {
    var Backbone = require('backbone'),
        Base = require('util/base'),

        Task = require('tasks/task'),
        TaskCollection = require('tasks/taskcollection'),

        Column = require('columns/column'),
        TaskNameColumn = require('columns/tasknamecolumn'),
        TaskBarsColumn = require('columns/taskbarscolumn'),

        DayInterval = require('intervals/dayinterval'),
        WeekInterval = require('intervals/weekinterval'),
        MonthInterval = require('intervals/monthinterval'),

        Colors = require('util/colors'),

        d3 = require('d3'),
        _ = require('underscore');

    return Base.extend({
        constructor: function(selector, customSettings) {
            // Call our super constructor.
            Base.apply(this);
            var gantt = this;

            // Create our settings object.
            var settings = _.defaults(customSettings || {}, {
                rowHeight: 25, // ganttd3.scss, line 1 - $row-height
                barHeight: 9,
                groupHeight: 7, // ganttd3.scss, line 7 - $group-bar-height
                barCompletionHeight: 3,
                groupCompletionHeight: 3,

                pathSeparator: '.',

                colorGenerator: function(d) {
                    if (d.get('group'))
                        return { bar: 'black', completion: '#555' };
                    else {
                        var color = Colors.lights(_.reduce(d.get('id').split(''), function(sum, c) { return sum + c.charCodeAt(); }, 0));
                        return { bar: color, completion: d3.rgb(color).brighter().toString() };
                    }
                },

                interval: new WeekInterval(),

                useDayInterval: function() { this.interval = new DayInterval(); gantt.redraw(); },
                useWeekInterval: function() { this.interval = new WeekInterval(); gantt.redraw(); },
                useMonthInterval: function() { this.interval = new MonthInterval(); gantt.redraw(); }
            });
            this.set('settings', settings);

            // Create our column models.
            var colName = new TaskNameColumn({ gantt: this });
            var colDuration = new Column({ gantt: this, name: 'duration', label: 'Est. Duration', accessor: Task.prototype.method('getEstDuration')});
            var colCompleted = new Column({ gantt: this, name: 'percent-completed', label: '% Completed', accessor: Task.prototype.method('getPercentCompletion')});
            var colEstStartDate = new Column({ gantt: this, name: 'est-start-date', label: 'Est. Start Date', accessor: Task.prototype.method('getFormattedDate', 'estStartDate')});
            var colEstEndDate = new Column({ gantt: this, name: 'est-end-date', label: 'Est. End Date', accessor: Task.prototype.method('getFormattedDate', 'estEndDate')});
            var colActStartDate = new Column({ gantt: this, name: 'act-start-date', label: 'Act. Start Date', accessor: Task.prototype.method('getFormattedDate', 'actStartDate')});
            var colActEndDate = new Column({ gantt: this, name: 'act-end-date', label: 'Act. End Date', accessor: Task.prototype.method('getFormattedDate', 'actEndDate')});
            var colBars = new TaskBarsColumn({ gantt: this });
            var columns = [colName, colDuration, colCompleted, colEstStartDate, colEstEndDate, colActStartDate, colActEndDate, colBars];
            this.set('columns', columns);

            // Create our TaskCollection that will hold all of our Task objects.
            var data = new TaskCollection();
            data.on('add remove', this.redraw, this);
            this.set('data', data);

            // Create our DOM elements.
            var table = d3.select(selector).append('table');
            this.set('selection', table);

            // First create the table row that will hold the date ranges.
            var rangesRow = table.append('tr')
                .classed('date-ranges', true)
                .style('opacity', 0);

            rangesRow.transition()
                .delay(200)
                .duration(200)
                .style('opacity', 1);

            //  This cell will cover all but the last (task bars) column.
            var rangesFillerCell = rangesRow.append('td').classed('spacer', true).attr('colspan', columns.length - 1);

            // Draw our columns.
            var columnsRow = table.append('tr')
                .classed('columns', true)
                .style('opacity', 0);

            columnsRow.transition()
                .delay(200)
                .duration(200)
                .style('opacity', 1);

            this.drawColumnHeadings(columnsRow);
            this.redraw();
        },

        createTask: function(options) {
            options = options || {}
            options.gantt = this;

            return new Task(options);
        },

        add: function(model) { //, options) {
            var gantt = this;
            var settings = this.get('settings')

            if (!model.has('gantt'))
                model.set('gantt', gantt);

            var path = model.get('path').slice(0);
            var parent;
            var search = this.get('data').models;
            var component;

            // Iterate through every element path component to work down the task tree.
            while (path.length) {
                component = path.shift();

                parent = _.find(search, function(t) {
                    return t.get('pathName') === component;
                });

                if (!parent) {
                    throw 'Component "' + component + '" in path "' + model.get('path') + '" does not exist'
                }

                search = parent.get('tasks');
            }

            // Add the task to the parent.
            model.set('parent', parent);
            search.push(model);
        },

        flattenTree: function(tasks) {
            var data = [];

            _.each(tasks, function(t) {
                data.push(t);
                data.push(this.flattenTree(t.get('tasks')));
            }, this);

            return _.chain(data).flatten().compact().value();
        },

        redraw: function() {
            var parent = this.get('selection');
            var data = this.flattenTree(this.get('data').models);

            // Get the data for this new redraw.
            var selection = parent.selectAll('tr.row').data(_.filter(data, function(cd,ci) {
                return cd.get('visible');
            }), Task.prototype.accessor('id'));

            // Create a row for every piece of data.
            var enter = selection.enter().append('tr').classed('row', true);

            // Update the current rows.
            selection.classed('group', Task.prototype.accessor('group'))
                .style('font-weight', Task.prototype.method('getRowFontWeight'));

            // Remove the non-existent rows.
            var exit = selection.exit().remove();

            // Reorder the elements so that any newly inserted elements are back where they belong.
            selection.order();

            // Render the columns.
            this.drawColumns(selection, enter);
        },

        drawColumnHeadings: function(columnsRow) {
            _.each(this.get('columns'), function(c) {
                c.renderHeading(columnsRow);
            })
        },

        drawColumns: function(update, enter) {
            _.each(this.get('columns'), function(c) {
                c.render(update, enter);
            });
        }
    });
});    return require('ganttd3');
}));