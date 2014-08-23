var SaltView = (function($, L, Models, Config) {

    var defaults = {

        // layer containing salt contour polylines
        saltGroup: L.geoJson(),

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

        var i = self.mapView.currentFrame;
        self.sfs.withSaltFrame(i, function(data) {
            drawContours(data, self.saltGroup);
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

    function drawContours(data, saltGroup) {
        saltGroup.clearLayers();
        saltGroup.addLayer(
            L.geoJson(data.contours, {
                style: function style() {
                    return {
                        color: this.color,
                        weight: this.weight
                    };
                }
            })
        );
    }

}(jQuery, L, Models, Config));
