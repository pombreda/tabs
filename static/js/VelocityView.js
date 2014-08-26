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

        self.mapView = mapView;
        self.vectorGroup.addTo(mapView.map);

        // put the initial velocity vectors on the map
        self.vfs.withVelocityGridLocations({}, function(points) {
            self.points = points;
            self.redraw();
        });

        return self;
    };


    VelocityView.prototype.redraw = function redraw(callback) {
        var self = this;

        // If we haven't been added to a map we don't bother redrawing
        if (!self.mapView || !self.points.length) {
            return self;
        }

        var style = {
            color: this.color,
            weight: this.weight
        };

        var options = {frame: self.mapView.currentFrame,
                       points: self.points,
                       mapScale: self.mapView.mapScale()};

        self.vfs.withVelocityFrame(options, function(data) {
            var vectors = data.vectors;
            var lines = [];
            for (var i = 0; i < vectors.length; i++) {
                lines.push(L.polyline(vectors[i], style));
            }
            // self.vectorGroup.clearLayers();
            self.vectorGroup = L.layerGroup(lines);
            self.mapView._blit.addLayer(self.vectorGroup);
            callback && callback(data);
        });
    };


    return {
        velocityView: function velocityView(config) {
            return new VelocityView(config);
        }
    };


    // Private Functions

    // function drawVectors(data, lines) {
        // lines.addLayer(L.layerGroup(
        // if (lines) {
            // lines.eachLayer(function _redraw(layer) {
                // layer.setLatLngs(this.latLngs[this.i++]);
            // }, {latLngs: data.vectors, i: 0});
        // }
    // }


}(jQuery, L, Models, Config));
