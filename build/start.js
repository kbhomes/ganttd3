(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.GanttD3 = factory();
    }
}(this, function () {
