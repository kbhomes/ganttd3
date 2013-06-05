define(function(require) {
    var Base = require('util/base'),
        Util = require('util/util'),
        d3 = require('d3'),
        _ = require('underscore'),
        Backbone = require('backbone');

    // Task
    return Base.extend({
        defaults: {
            id: '',
            name: '',
            path: [],
            number: '',
            estStartDate: null,
            estEndDate: null,
            actStartDate: null,
            actEndDate: null,
            completed: 0.00,
            collapsed: false,
            visible: true,
            caption: ''
        },

        get: function(attr) {
            var value = Backbone.Model.prototype.get.call(this, attr);

            if (typeof value == 'function' && (
                    attr == 'group' ||
                    attr == 'estStartDate' ||
                    attr == 'estEndDate' ||
                    attr == 'actStartDate' ||
                    attr == 'actEndDate' ||
                    attr == 'color' ||
                    attr == 'completed'
                ))
            {
                return value.call(this);
            }
            else {
                return value;
            }
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

            this.set('group', function() {
                return this.get('forceGroup') || this.get('tasks').length > 0;
            });

            this.initializeComputedProperties(settings);
        },

        initializeComputedProperties: function(settings) {
            this.set('_estStartDate', this.get('estStartDate'));
            this.set('estStartDate', function() {
                if (this.get('forceEstStartDate'))
                    return this.get('_estStartDate');

                if (this.get('group'))
                    return d3.min(this.get('tasks'), function(t) { return t.get('estStartDate'); });
                else
                    return this.get('_estStartDate');
            });

            this.set('_estEndDate', this.get('estEndDate'));
            this.set('estEndDate', function() {
                if (this.get('forceEstEndDate'))
                    return this.get('_estEndDate');

                if (this.get('group'))
                    return d3.max(this.get('tasks'), function(t) { return t.get('estEndDate'); });
                else
                    return this.get('_estEndDate');
            });

            this.set('_actStartDate', this.get('actStartDate'));
            this.set('actStartDate', function() {
                if (this.get('forceActStartDate'))
                    return this.get('_actStartDate');

                if (this.get('group'))
                    return d3.min(this.get('tasks'), function(t) { return t.get('actStartDate'); });
                else
                    return this.get('_actStartDate');
            });

            this.set('_actEndDate', this.get('actEndDate'));
            this.set('actEndDate', function() {
                if (this.get('forceActEndDate'))
                    return this.get('_actEndDate');

                if (this.get('group')) {
                    if (_.every(this.get('tasks'), function(t) { return t.get('actEndDate'); }))
                        return d3.max(this.get('tasks'), function(t) { return t.get('actEndDate'); });
                    else
                        return undefined;
                }
                else
                    return this.get('_actEndDate');
            });

            this.set('_color', this.get('color'));
            this.set('color', function() {
                if (this.get('_color'))
                    return this.get('_color');

                if (settings && typeof settings.colorGenerator == 'function') {
                    return settings.colorGenerator(this);
                }
                else {
                    return undefined;
                }
            });

            this.set('_completed', this.get('completed'));
            this.set('completed', function() {
                if (this.get('forceCompleted'))
                    return this.get('_completed');

                if (this.get('group')) {
                    var children = this.get('tasks');
                    var comp = d3.mean(_.map(children, function(d) { return d.get('completed'); }));
                    return comp;
                }
                else {
                    if (!this.get('actStartDate')) {
                        return undefined;
                    }
                    else {
                        // If there's an end date, the project is completed (100%).
                        if (this.get('actEndDate')) {
                            return 100;
                        }
                        // Otherwise, show the manually entered completion.
                        else {
                            return this.get('_completed');
                        }
                    }
                }
            });
        },

        getEstDuration: function() {
            if (!this.get('estStartDate') || !this.get('estEndDate'))
                return '';

            var days = ((this.get('estEndDate') - this.get('estStartDate')) / (1000 * 60 * 60 * 24) + 1);
            return days + (days == 1 ? ' day' : ' days');
        },

        getPercentCompletion: function() {
            if (this.get('completed')) {
                var comp = this.get('completed');

                if (comp.toFixed(0) == comp)
                    comp = comp.toFixed(0);
                else
                    comp = comp.toFixed(1);

                return comp + '%';
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

            if (first == true)
                gantt.redraw();
        },

        toString: function() {
            return 'Task ' + this.get('id');
        }
    });
});