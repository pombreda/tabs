var VelocityView = (function($, L, Models, Config) {

    var defaults = {

        // global layer to update vector multiPolylines
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

        var vectorStyle = {
            color: this.color,
            weight: this.weight
        };

        // put the initial velocity vectors on the map
        this.vfs.withVelocityGridLocations(function(points) {
            self.points = points;

            self.vfs.withVelocityFrame(
                    mapView.currentFrame, points, mapView.mapScale(),
                    function(data) {
                var vectors = data.vectors;
                for (var i = 0; i < vectors.length; i++) {
                    var line = L.polyline(vectors[i], vectorStyle);
                    self.vectorGroup.addLayer(line);
                }
                self.vectorGroup.addTo(mapView.map);
            });
        });

        return this;
    };


    VelocityView.prototype.redraw = function redraw(callback) {
        var self = this;
        // If we haven't been added to a map we don't bother redrawing
        if (!self.mapView) {
            return this;
        }

        var i = self.mapView.currentFrame;
        self.vfs.withVelocityFrame(i, self.points, self.mapView.mapScale(),
            function(data) {
                drawVectors(data, self.vectorGroup);
                callback && callback(data);
            }
        );
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
