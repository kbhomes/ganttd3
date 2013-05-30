define(function(require) {
    var Base = require('util/base'),
        Util = require('util/util'),
        d3 = require('d3'),
        _ = require('underscore');

    // Task
    return Base.extend({
        defaults: {
            id: '',
            number: '',
            estStartDate: new Date(),
            estEndDate: new Date(),
            actStartDate: new Date(),
            actEndDate: new Date(),
            color: '',
            link: '',
            milestone: false,
            resource: '',
            completed: 0.00,
            group: true,
            parent: '',
            open: true,
            dependencies: '',
            caption: ''
        },

        initialize: function() {
            if (!this.has('collapsed')) {
                this.set('collapsed', false);
            }

            if (!this.has('visible')) {
                this.set('visible', true)
            }
        },

        getEstDuration: function() {
            var days = ((this.get('estEndDate') - this.get('estStartDate')) / (1000 * 60 * 60 * 24) + 1);
            return days + (days == 1 ? ' day' : ' days');
        },

        getComputedCompletion: function() {
            if (!this.has('computedCompletion')) {
                if (this.get('group') && this.has('gantt')) {
                    var id = this.get('id');
                    var data = this.get('gantt').get('data');
                    var comp = Math.ceil(d3.mean(data.filter(function(d) { return d.get('parent') == id; }).map(function(d) { return d.getComputedCompletion(); })));
                    this.set('computedCompletion', comp);
                    return comp;
                }
                else {
                    var comp = this.get('completed');
                    this.set('computedCompletion', comp);
                    return comp;
                }
            }
            else {
                return this.get('computedCompletion');
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
            var gantt = this.get('gantt');
            var data = gantt.get('data');

            var indent = 0;
            var ancestor, ancestorId = this.get('parent');

            while (ancestorId && (ancestor = data.get(ancestorId))) {
                ancestorId = ancestor.get('parent');
                indent++;
            }

            return 'indent' + indent;
        },

        getRowFontWeight: function() {
            return this.get('group') ? 'bold' : 'normal';
        },

        getChildren: function(directOnly) {
            if (!this.get('group'))
                return;

            var gantt = this.get('gantt');
            var data = gantt.get('data');
            var id = this.get('id');

            var ret = {};
            ret.children = data.filter(function(d,i) {
                return d.get('parent') == id;
            });

            if (!directOnly) {
                ret.descendants = ret.children.map(function(cd, ci) {
                   return cd.getChildren();
                });
            }

            return ret;
        },

        toggleChildren: function(first, descendants, show) {
            if (!this.has('gantt'))
                return;

            var gantt = this.get('gantt');
            var data = gantt.get('data');

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
    });
});