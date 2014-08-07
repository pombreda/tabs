L.mapbox.accessToken = 'pk.eyJ1IjoidGFicy1lbnRob3VnaHQiLCJhIjoidnFxYklhcyJ9.IIjR0C-iZtw_Fr0sKUyQXQ';
var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/tabs-enthought.j3nibphe/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

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
function vectors(points, velocityVectors) {
    var vectors = [];
    var scale = 0.5;	// vector scaling (m/s -> degrees)
    for (var i=0; i<points.length; i++) {
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
	L.multiPolyline(vectors(points, json), vectorStyle)
	    .addTo(map);
    })
}


//addRegionOutline();

// put the initial velocity vectors on the map
$.getJSON('json_data/grd_locations.json', function(json) {
    var points = [];
    for (var i=0; i<json['lat'].length; i++) {
	points.push([json.lat[i], json.lon[i]]);
    }
    addVectorLayer(points);
});
