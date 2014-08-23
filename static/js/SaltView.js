var SaltView = (function($, L, Models, Config) {

    var defaults = {

        // layer containing salt contour polylines
        saltGroup: L.geoJson(),

        // The number of contour levels to show
        numSaltLevels: 10,

        // Contour artist parameters
        color: 'black',
        weight: 1

    };

    var SaltView = function SaltView(config) {

        $.extend(this, defaults, config);

        this.sfs = Models.saltFrameSource();

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
                drawContours(data, self.saltGroup, function() {
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

    function drawContours(data, saltGroup, styleFunc) {
        saltGroup.clearLayers();
        saltGroup.addLayer(
            L.geoJson(data.contours, {style: styleFunc})
        );
    }

}(jQuery, L, Models, Config));
