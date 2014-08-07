L.mapbox.accessToken = 'pk.eyJ1IjoidGFicy1lbnRob3VnaHQiLCJhIjoidnFxYklhcyJ9.IIjR0C-iZtw_Fr0sKUyQXQ';
var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/tabs-enthought.j3nibphe/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

var map = L.map('map')
    .addLayer(mapboxTiles)
    .setView([27, -94], 7);

// hard-coded region of interest outline
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
