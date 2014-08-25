var SaltView = (function($, L, Models, Config) {

    var defaults = {

        // layer containing salt contour polylines
        saltGroup: L.geoJson(),

        // The number of contour levels to show
        numSaltLevels: 10,

        // Contour artist parameters
        strokeColor: 'black',
        strokeWeight: 0.5

    };

    var SaltView = function SaltView(config) {

        var self = this;

        $.extend(self, defaults, config);

        self.sfs = Models.saltFrameSource();

    };


    SaltView.prototype.addTo = function addTo(mapView) {
        var self = this;

        this.mapView = mapView;

        // Put the initial contours on the map
        this.redraw(function initialCallback() {
            self.saltGroup.addTo(mapView.map);
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
            drawContours(data, self.saltGroup, featureStyleFunc(self));
            callback && callback(data);
        });
        return this;
    };


    return {
        saltView: function saltView(config) {
            return new SaltView(config);
        }
    };


    // Private Functions

    function featureStyleFunc(options) {
        function featureStyleFuncInner(feature) {
            return {
                fillColor: feature.properties.color || options.fillColor,
                fillOpacity: feature.properties.opacity || options.fillOpacity,
                weight: options.strokeWeight
                color: options.strokeColor
            };
    }


    function drawContours(data, saltGroup, styleFunc) {
        saltGroup.clearLayers();
        saltGroup.addLayer(
            L.geoJson(data.contours, {style: styleFunc})
        );
    }

}(jQuery, L, Models, Config));
