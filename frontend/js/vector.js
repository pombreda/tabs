L.mapbox.accessToken = 'pk.eyJ1IjoidGFicy1lbnRob3VnaHQiLCJhIjoidnFxYklhcyJ9.IIjR0C-iZtw_Fr0sKUyQXQ';
var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/tabs-enthought.j3nibphe/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

var delay = 90;                 // speed of animation (larger is slower)
var vectorGroup = L.layerGroup([]); // global layer to update vector multiPolylines
var isRunning = true;
var points = [];
var nSteps = 90;                // number of time steps to use

var map = L.map('map')
    .addLayer(mapboxTiles)
    .setView([27, -94], 7);

// hard-coded region of interest outline
function addRegionOutline() {
    var featureLayer = L.mapbox.featureLayer()
        .loadURL('json_data/domain.json')
        .on('ready', function(layer) {
            this.eachLayer(function(poly) {
                poly.setStyle({
                    color: "red",
                    fill: false
                });
            })
        })
        .addTo(map);
}

// parse the velocity vectors and return lines in lat/lon space
function getVectors(points, velocityVectors) {
    var vectors = [];
    var scale = 0.5;        // vector scaling (m/s -> degrees)
    for (var i=0; i<nPoints; i++) {
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
        weight: 1,
    }
    $.getJSON('json_data/step0.json', function(json) {
        vectorGroup.addLayer(L.multiPolyline(getVectors(points, json), vectorStyle))
            .addTo(map);
        showTimeStep(1);
    })
}

// update vector data at each time step
function showTimeStep(j) {
    var layer = vectorGroup.getLayers()[0];
        $.getJSON('json_data/step' + j + '.json', function(json) {
            layer.setLatLngs(getVectors(points, json));
        });
    if (isRunning) {
        nextj = (j + 1) % nSteps;
        setTimeout(function(i) {
            return function() {
                showTimeStep(i);
            }
        }(nextj), delay);
    }
}

//addRegionOutline();

// put the initial velocity vectors on the map
$.getJSON('json_data/grd_locations.json', function(json) {
    nPoints = json['lat'].length;
    for (var i=0; i<nPoints; i++) {
        points.push([json.lat[i], json.lon[i]]);
    }
    addVectorLayer(points);
});
