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
var arrowHeads;
var isRunning = true;
var points = [];
// number of time steps to use
var nSteps = 90;

var map = L.map('map',
    {center: [27, -94],
     zoom: 7,
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

// parse the velocity vectors and return lines in lat/lon space
function getVectors(points, velocityVectors) {
    var vectors = [];
    var scale = 0.5;    // vector scaling (m/s -> degrees)
    for (var i = 0; i < nPoints; i++) {
        var dlat = velocityVectors.v[i] * scale;
        var dlon = velocityVectors.u[i] * scale;
        var endpoint = [points[i][0] + dlat, points[i][1] + dlon];
        vectors.push([points[i], endpoint]);
    }
    return vectors;
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
        arrowHeads = L.polylineDecorator(lines, {
            patterns: [{
                repeat: 0,
                symbol: L.Symbol.arrowHead({pixelSize: 15,
                    polygon: false,
                    pathOptions: {stroke: true, color: 'black', weight: 1}}),
                offset: 0
            }]
        });
        arrowHeads.addTo(map);
        vectorGroup.addTo(map);
        showTimeStep(1);
    });
}

// update vector data at each time step
function showTimeStep(i) {
    var lines = vectorGroup.getLayers();
    var arrows = arrowHeads;
    $.getJSON('json_data/step' + i + '.json', function(json) {
        var latLngs = getVectors(points, json);
        for (var j = 0; j < lines.length; j++) {
            lines[j].setLatLngs(latLngs[j]);
        }
        // arrowHeads.setPaths(latLngs);
    });
    if (isRunning) {
        nexti = (i + 1) % nSteps;
        setTimeout(function(j) {
            return function() {
                showTimeStep(j);
            }
        }(nexti), delay);
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
