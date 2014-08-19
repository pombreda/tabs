
L.mapbox.accessToken = 'pk.eyJ1IjoidGFicy1lbnRob3VnaHQiLCJhIjoidnFxYklhcyJ9.IIjR0C-iZtw_Fr0sKUyQXQ';

var mapView = MapView.mapView();

function relativeAngle(start, end) {
    var dx = end[1] - start[1];
    var dy = end[0] - start[0];
    return Math.atan2(dy, dx);
}

function rotate(points, theta) {
    var c0 = Math.cos(theta);
    var s0 = Math.sin(theta);
    var new_points = [];
    for (var i = 0, len = points.length; i < len; i++) {
        var p = points[i];
        var x2 = p[1] * c0 - p[0] * s0;
        var y2 = p[1] * s0 + p[0] * c0;
        new_points.push([y2, x2]);
    }
    return new_points;
}



//addRegionOutline();
