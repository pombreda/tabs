var VelocityView = (function($, L, Models, Config) {

    var defaults = {

        // layer containing vector polylines
        vectorGroup: L.layerGroup([]),

        // The locations of the data points
        points: [],

        // Position of the barbs on the arrows ('head', 'center', 'tail')
        barbLocation: Config.barbLocation,

        // Fraction of vector length to make arrow strokes
        arrowHeadSize: Config.arrowHeadSize,

        // Degrees!
        arrowHeadAngle: Config.arrowHeadAngle,

        // Vector artist parameters
        color: 'black',
        weight: 1

    };


    var VelocityView = function VelocityView(config) {

        $.extend(this, defaults, config);

        // Convert to radians
        this.arrowHeadAngle *= Math.PI / 180;

        this.vfs = Models.velocityFrameSource({
            barbLocation: this.barbLocation,
            arrowHeadSize: this.arrowHeadSize,
            arrowHeadAngle: this.arrowHeadAngle});

    };


    VelocityView.prototype.addTo = function addTo(mapView) {
        var self = this;

        this.mapView = mapView;

        mapView.layerSelectControl.addToggledOverlay(
            'velocity', self.vectorGroup, 'Velocity');

        if (self.mapView.visibleLayers.velocity) {
            self.vectorGroup.addTo(mapView.map);
        }

        var style = {
            color: this.color,
            weight: this.weight
        };

        // put the initial velocity vectors on the map
        this.vfs.withVelocityGridLocations({}, function(points) {
            self.points = points;

            var options = {frame: mapView.currentFrame,
                           points: points,
                           mapScale: mapView.mapScale()};
            self.vfs.withVelocityFrame(options, function(data) {
                var vectors = data.vectors;
                for (var i = 0; i < vectors.length; i++) {
                    var line = L.polyline(vectors[i], style);
                    self.vectorGroup.addLayer(line);
                }
            });
        });

        return this;
    };


    VelocityView.prototype.redraw = function redraw(callback) {
        var self = this;

        // If we haven't been added to a map we don't bother redrawing
        if (!self.mapView || !self.points.length) {
            return this;
        }

        var options = {frame: self.mapView.currentFrame,
                       points: self.points,
                       mapScale: self.mapView.mapScale()};
        self.vfs.withVelocityFrame(options, function(data) {
            drawVectors(data, self.vectorGroup);
            callback && callback(data);
        });
    };


    return {
        velocityView: function velocityView(config) {
            return new VelocityView(config);
        }
    };


    // Private Functions

    function drawVectors(data, lines) {
        if (lines) {
            lines.eachLayer(function _redraw(layer) {
                layer.setLatLngs(this.latLngs[this.i++]);
            }, {latLngs: data.vectors, i: 0});
        }
    }


}(jQuery, L, Models, Config));
