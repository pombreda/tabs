var SaltView = (function($, L, Models, Config) {

    var defaults = {

        // Layer for salinity heatmap
        heatLayer: L.heatLayer([]),

        // Layer containing contour polylines
        contourLayer: L.geoJson(),

        // Parent layer for all salinity visualizations
        saltLayer: L.layerGroup(),

        // The number of contour levels to show
        numSaltLevels: 10,

        // Contour artist parameters
        color: 'black',
        weight: 1

    };

    var SaltView = function SaltView(config) {

        var self = this;

        $.extend(self, defaults, config);

        self.sfs = Models.saltFrameSource();

        self.saltLayer.addLayer(self.heatLayer);
        self.saltLayer.addLayer(self.contourLayer);

    };


    SaltView.prototype.addTo = function addTo(mapView) {
        var self = this;

        this.mapView = mapView;

        // Put the initial contours on the map
        this.redraw(function initialCallback() {
            self.saltLayer.addTo(mapView.map);
        });

        return this;
    };


    SaltView.prototype.redraw = function redraw(callback) {
        var self = this;

        // If we haven't been added to a map we don't bother redrawing
        if (!self.mapView) {
            return this;
        }

        var config = {frame: self.mapView.currentFrame,
                      numSaltLevels: self.numSaltLevels};
        self.sfs.withSaltFrame(config, function(data) {
                drawHeat(data['values'], self.heatLayer);
                drawContours(data, self.contourLayer, function() {
                    return {
                        color: self.color,
                        weight: self.weight
                    };
                });
                callback && callback(data);
            }
        );

        return this;
    };


    return {
        saltView: function saltView(config) {
            return new SaltView(config);
        }
    };


    // Private Functions

    function drawContours(data, contourLayer, styleFunc) {
        contourLayer.clearLayers();
        contourLayer.addLayer(
            L.geoJson(data.contours, {style: styleFunc})
        );
    }


    function drawHeat(values, heatLayer) {
        var latLngs = [];
        var lat = values.lat;
        var lng = values.lng;
        var salt = values.salt;
        for (var i = 0, len = salt.length; i < len; i++) {
            latLngs.push([lat[i], lng[i], salt[i].toString()]);
        }
        // Manually set this to avoid redraw
        heatLayer._latlngs = latLngs;

        var options = {
            max: 2,
            blur: mapView.map.getZoom(),
            radius: mapView.map.getZoom(),
            // maxZoom: 1
        };
        console.log(options);
        heatLayer.setOptions(options);
    }

}(jQuery, L, Models, Config));
