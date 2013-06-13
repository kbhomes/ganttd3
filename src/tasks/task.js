define(function(require) {
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

        get: function(attr) {
            var value = Backbone.Model.prototype.get.call(this, attr);

            if (value instanceof ComputedAttribute) {
                return value.get();
            }
            else {
                return value;
            }
        },

        set: function(attr, value) {
            var target = Backbone.Model.prototype.get.call(this, attr);

            if (target instanceof ComputedAttribute) {
                target.set(value)
            }
            else {
                Backbone.Model.prototype.set.call(this, attr, value);
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
        },

        toString: function() {
            return 'Task ' + this.get('id');
        }
    });
});