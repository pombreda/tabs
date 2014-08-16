L.mapbox.accessToken = 'pk.eyJ1IjoidGFicy1lbnRob3VnaHQiLCJhIjoidnFxYklhcyJ9.IIjR0C-iZtw_Fr0sKUyQXQ';
var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/tabs-enthought.j3nibphe/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
    maxZoom: 11,
    minZoom: 7
});

Number.prototype.padLeft = function(width, chr) {
    var len = ((width || 2) - String(this).length) + 1;
    return len > 0 ? new Array(len).join(chr || '0') + this : this;
};
var monthStrings = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
                    'Sep', 'Oct', 'Nov', 'Dec'];

// speed of animation (larger is slower)
var delay = 90;
// global layer to update vector multiPolylines
var vectorGroup = L.layerGroup([]);
var isRunning = true;
var points = [];
// number of time steps to use
var nSteps = 90;
// cache of velocity data
var velocities = [];
// initial zoom level
var defaultZoom = 7;

// Fraction of vector length to make arrow strokes
var arrowHeadSize = 0.15;
// Radians!
var arrowHeadAngle = 60 * Math.PI / 180;

var map = L.map('map',
    {center: [27, -94],
     zoom: defaultZoom,
     layers: [mapboxTiles]
});

var TABSControl = L.Control.extend({

    initialize: function(foo, options) {
        L.Util.setOptions(this, options);
        this.frame = 0;
        this.date = new Date();
        this.updateInfo(options);
    },

    options: {
        position: 'topright'
    },

    onAdd: function(map) {
        this._map = map;

        // Steal the attribution CSS for now
        var classes = 'tabs-control leaflet-control-attribution leaflet-control';
        this.container = L.DomUtil.create('div', classes);

        // Toggle the run state
        self = this;
        this.container.onclick = function() {
            isRunning = !isRunning;
            if (isRunning) {
                showTimeStep(self.frame);
            }
        };

        this._redraw();
        return this.container;
    },

    updateInfo: function(info) {
        if (info) {
            if (info.hasOwnProperty('frame')) {
                this.frame = info.frame;
            }
            if (info.hasOwnProperty('date')) {
                if (info.date[info.date.length - 1] != 'Z') {
                    info.date += 'Z';
                }
                this.date = new Date(Date.parse(info.date));
            }
            this._redraw();
        }
    },

    _redraw: function() {
        this.container.innerHTML = (
            this._renderDate() + '<br/>' +
            'Frame: ' + this.frame.padLeft(2) + ' / ' + nSteps);
    },

    _renderDate: function() {
        var d = this.date;
        var day_month_year = [d.getUTCDate().padLeft(),
                              monthStrings[d.getUTCMonth()],
                              d.getFullYear()].join(' ');
        var hour_min = [d.getHours().padLeft(),
                        d.getMinutes().padLeft()].join(':');
        return day_month_year + '<br/>' + hour_min + ' UTC';
    }
});

var tabsControl = new TABSControl();
map.addControl(tabsControl);

function mapScale() {
    var scale = 0.5;     // vector scaling (m/s -> degrees) at default zoom
    var zoom = map.getZoom();
    return scale * Math.pow(2, defaultZoom - zoom);
}

// parse the velocity vectors and return lines in lat/lon space
function getDataSnapshot(points, velocityVectors) {
    var vectors = [];
    var scale = mapScale();
    for (var i = 0; i < nPoints; i++) {
        var dlat = velocityVectors.v[i] * scale;
        var dlon = velocityVectors.u[i] * scale;
        var endpoint = [points[i][0] + dlat, points[i][1] + dlon];
        var tail = make_tail(points[i], endpoint);
        // This draws the arrow shaft twice but felt noticeably faster than
        // drawing the shaft and tail separately
        var arrow = [tail[0], points[i], endpoint, points[i], tail[1]];
        vectors.push(arrow);
    }
    date = velocityVectors.date;
    return {date: date, vectors: vectors};
}


function relative_angle(start, end) {
    var dx = end[1] - start[1];
    var dy = end[0] - start[0];
    return Math.atan2(dy, dx);
}

function make_tail(start, end) {
    // Return the two points needed to put a 'tail' on a line segment
    var theta = relative_angle(start, end);
    var p = rotate([start], -theta)[0];

    var dx2 = Math.pow(end[1] - start[1], 2);
    var dy2 = Math.pow(end[0] - start[0], 2);
    var length = Math.sqrt(dx2 + dy2) * arrowHeadSize;
    var arrowX = length * Math.cos(arrowHeadAngle);
    var arrowY = length * Math.sin(arrowHeadAngle);
    var lng = p[1] - arrowX;
    var latL = p[0] + arrowY;
    var latR = p[0] - arrowY;

    var tail_points = rotate([[latL, lng], [latR, lng]], theta);

    return tail_points;
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


// add a vector layer to the map at the initial grid points
function addVectorLayer(points) {
    var vectorStyle = {
        color: 'black',
        weight: 1
    };
    $.getJSON('/data/prefetched/step/0', function(json) {
        var data = getDataSnapshot(points, json);
        var vectors = data.vectors;
        var lines = [];
        for (var i = 0; i < vectors.length; i++) {
            var line = L.polyline(vectors[i], vectorStyle);
            lines.push(line);
            vectorGroup.addLayer(line);
        }
        vectorGroup.addTo(map);
        showTimeStep(1);
    });
}

// update vector data at each time step
function showTimeStep(i) {
    var lines = vectorGroup.getLayers();
    if (velocities[i] == undefined) {
        $.getJSON('/data/prefetched/step/' + i, function(json) {
            velocities[i] = json;
            var data = getDataSnapshot(points, velocities[i]);
            var latLngs = data.vectors;
            for (var j = 0; j < lines.length; j++) {
                lines[j].setLatLngs(latLngs[j]);
            }
            tabsControl.updateInfo({frame: i, date: data.date});
        });
    } else {
        setTimeout(function() {
            var data = getDataSnapshot(points, velocities[i]);
            var latLngs = data.vectors;
            for (var j = 0; j < lines.length; j++) {
                lines[j].setLatLngs(latLngs[j]);
            }
            tabsControl.updateInfo({frame: i, date: data.date});
        }, 0);
    }
    if (isRunning) {
        nexti = (i + 1) % nSteps;
        setTimeout(showTimeStep, delay, nexti);
    }
}


// put the initial velocity vectors on the map
$.getJSON('/data/prefetched/grid', function(json) {
    nPoints = json['lat'].length;
    for (var i = 0; i < nPoints; i++) {
        points.push([json.lat[i], json.lon[i]]);
    }
    addVectorLayer(points);
});
