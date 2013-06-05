define(function(require) {
    var d3 = require('d3');

    var _brights = ['#ff00ff', '#00ff00', '#0000ff', '#ff0000', '#669900', '#6600ff', '#996633', '#0ffff0', '#ffcc00', '#ffff00'];

    return {
        brights: d3.scale.ordinal().range(_brights),
        lights: d3.scale.category10()
    };
});