L.mapbox.accessToken = 'pk.eyJ1IjoidGFicy1lbnRob3VnaHQiLCJhIjoidnFxYklhcyJ9.IIjR0C-iZtw_Fr0sKUyQXQ';
var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/tabs-enthought.j3nibphe/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
    maxZoom: 11,
    minZoom: 7
});

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
// Position of the barbs on the arrows ('head', 'center', 'tail')
// Or as a fraction of distance from head to tail (head = 1, tail = 0)
var barbLocation = 'head';

var map = L.map('map',
    {center: [27, -94],
     zoom: defaultZoom,
     layers: [mapboxTiles]
});

// hard-coded region of interest outline
function addRegionOutline() {
    var featureLayer = L.mapbox.featureLayer()
        .loadURL('json_data/domain.json')
        .on('ready', function(layer) {
            this.eachLayer(function(poly) {
                poly.setStyle({
                    color: 'red',
                    fill: false
                });
            });
        })
        .addTo(map);
}


var TABSControl = L.Control.extend({

    initialize: function(foo, options) {
        L.Util.setOptions(this, options);
        this.frame = 0;
        this.updateInfo(options);
    },

    options: {
        position: 'topright'
    },

    onAdd: function(map) {
        this._map = map;

        // Steal the attribution CSS for now
        var classes = 'leaflet-control-attribution leaflet-control';
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
            this._redraw();
        }
    },

    _redraw: function() {
        this.container.innerHTML = this.frame + ' / ' + nSteps;
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
function getVectors(points, velocityVectors) {
    var vectors = [];
    var scale = mapScale();
    for (var i = 0; i < nPoints; i++) {
        var dlat = velocityVectors.v[i] * scale;
        var dlon = velocityVectors.u[i] * scale;
        var endpoint = [points[i][0] + dlat, points[i][1] + dlon];
        switch (barbLocation) {
            case 'tail':
                var barbPosition = 0.0;
                break;
            case 'center':
                var barbPosition = 0.5;
                break;
            case 'head':
                var barbPosition = 1.0;
                break;
            default:
                if (Number.isFinite(barbLocation)) {
                    var barbPosition = Math.min(Math.max(barbLocation, 0), 1);
                } else {
                    var barbPosition = 1.0;
                    console.log('Invalid barbLocation (' + barbLocation + ')');
                }
        }
        var barb = make_barb(points[i], endpoint, barbPosition);
        // Ideally we'd push the arrow and barb separately, but we really need
        // to draw the arrow in one stroke for performance reasons
        var arrow = [barb[0], barb[1], barb[2], barb[1],
                     endpoint, points[i]];
        vectors.push(arrow);
    }
    return vectors;
}


function relative_angle(start, end) {
    var dx = end[1] - start[1];
    var dy = end[0] - start[0];
    return Math.atan2(dy, dx);
}

function make_barb(start, end, barbPosition) {
    barbPosition = barbPosition || 1.0;
    // Return the three points needed to put a 'barb' on a line segment
    // left tail, center, right tail
    var theta = relative_angle(start, end);
    var lat = start[0] * (1 - barbPosition) + end[0] * barbPosition;
    var lon = start[1] * (1 - barbPosition) + end[1] * barbPosition;
    var p = rotate([[lat, lon]], -theta)[0];

    var dx2 = Math.pow(end[1] - start[1], 2);
    var dy2 = Math.pow(end[0] - start[0], 2);
    var length = Math.sqrt(dx2 + dy2) * arrowHeadSize;
    var lng = p[1] - length;
    var latL = p[0] + length;
    var latR = p[0] - length;

    var barb_points = rotate([[latL, lng], p, [latR, lng]], theta);

    return barb_points;
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
    $.getJSON('json_data/step0.json', function(json) {
        var multiCoords1 = getVectors(points, json);
        var lines = [];
        for (var i = 0; i < multiCoords1.length; i++) {
            var line = L.polyline(multiCoords1[i], vectorStyle);
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
        $.getJSON('json_data/step' + i + '.json', function(json) {
            velocities[i] = json;
            var latLngs = getVectors(points, velocities[i]);
            for (var j = 0; j < lines.length; j++) {
                lines[j].setLatLngs(latLngs[j]);
            }
            tabsControl.updateInfo({frame: i});
        });
    } else {
        setTimeout(function() {
            var latLngs = getVectors(points, velocities[i]);
            for (var j = 0; j < lines.length; j++) {
                lines[j].setLatLngs(latLngs[j]);
            }
            tabsControl.updateInfo({frame: i});
        }, 0);
    }
    if (isRunning) {
        nexti = (i + 1) % nSteps;
        setTimeout(showTimeStep, delay, nexti);
    }
}

//addRegionOutline();

// put the initial velocity vectors on the map
$.getJSON('json_data/grd_locations.json', function(json) {
    nPoints = json['lat'].length;
    for (var i = 0; i < nPoints; i++) {
        points.push([json.lat[i], json.lon[i]]);
    }
    addVectorLayer(points);
});
