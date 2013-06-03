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
            estStartDate: new Date(),
            estEndDate: new Date(),
            actStartDate: new Date(),
            actEndDate: new Date(),
            color: '',
            completed: 0.00,
            collapsed: false,
            visible: true,
            caption: ''
        },

        get: function(attr) {
            var value = Backbone.Model.prototype.get.call(this, attr);

            if (typeof value == 'function' && (attr == 'group' || attr == 'actStartDate' || attr == 'actEndDate')) {
                return value.call(this);
            }
            else {
                return value;
            }
        },

        initialize: function() {
            this.set('tasks', []);

            // Parse an ID path into its components.
            var path = this.get('id').split('/');
            var name = path.pop();

            this.set('path', path)
            this.set('name', name);

            this.set('group', function() {
                return this.get('forceGroup') || this.get('tasks').length > 0;
            });

            this.set('_actStartDate', this.get('actStartDate'));
            this.set('actStartDate', function() {
                return this.get('forceActStartDate') ||
                    this.get('group') ?
                        d3.min(this.get('tasks'), function(t) { return t.get('actStartDate'); }) :
                        this.get('_actStartDate');
            });

            this.set('_actEndDate', this.get('actEndDate'));
            this.set('actEndDate', function() {
                if (this.get('forceActEndDate'))
                    return this.get('forceActEndDate');

                if (this.get('group')) {
                    if (_.every(this.get('tasks'), function(t) { return t.get('actEndDate'); }))
                        return d3.max(this.get('tasks'), function(t) { return t.get('actEndDate'); });
                    else
                        return undefined;
                }
                else
                    return this.get('_actEndDate');
            });
        },

        getEstDuration: function() {
            var days = ((this.get('estEndDate') - this.get('estStartDate')) / (1000 * 60 * 60 * 24) + 1);
            return days + (days == 1 ? ' day' : ' days');
        },

        getComputedCompletion: function() {
            if (this.get('group')) {
                var children = this.get('tasks');
                var comp = Math.ceil(d3.mean(_.map(children, function(d) { return d.getComputedCompletion(); })));

                return comp;
            }
            else {
                return this.get('completed');
            }
        },

        getPercentCompletion: function() {
            if (this.getComputedCompletion())
                return this.getComputedCompletion().toFixed(0) + '%';
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
            var rgb;

            if (!this.get('group') && this.get('color').length) {
                rgb = d3.rgb('#' + this.get('color'));
            }
            else {
                rgb = d3.rgb('black');
            }

            return rgb.toString();
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
            var rgb;

            if (!this.get('group') && this.get('color').length) {
                rgb = d3.rgb('#' + this.get('color')).darker(1);
            }
            else {
                rgb = d3.rgb('#555');
            }

            return rgb.toString();
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