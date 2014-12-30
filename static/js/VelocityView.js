var VelocityView = (function($, L, Models, Config) {

    var defaults = {

        // layer containing currently displayed vector polylines
        vectorGroup: L.layerGroup([]),

        // The number of vectors to display
        displayPoints: 0,

        // Collection of all vector polylines
        allVectors: [],

        // The locations of the data points
        points: [],

        // Position of the barbs on the arrows ('head', 'center', 'tail')
        barbLocation: Config.barbLocation,

        // Fraction of vector length to make arrow strokes
        arrowHeadSize: Config.arrowHeadSize,

        // Degrees!
        arrowHeadAngle: Config.arrowHeadAngle,

        // Number of vectors at full zoom
        vectorDensity: Config.vectorDensity,

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

        self.mapView.map.on('dragend', function() {
            self.redraw(undefined, function() {return true;});
        });

        mapView.layerSelectControl.addToggledOverlay(
            'velocity', self.vectorGroup, 'Velocity');

        if (self.mapView.visibleLayers.velocity) {
            self.vectorGroup.addTo(mapView.map);
        }

        var style = {
            color: self.color,
            weight: self.weight
        };

        // Build the set of vectors to display
        self.vfs.withVelocityGridLocations({}, function(points) {
            self.points = points;

            var options = {frame: mapView.currentFrame,
                           points: points,
                           mapScale: mapView.mapScale()};
            self.vfs.withVelocityFrame(options, function(data) {
                var vectors = data.vectors;
                for (var i = 0; i < vectors.length; i++) {
                    var line = L.polyline(vectors[i], style);
                    self.allVectors.push(line);
                }
            });

            // Put the initial velocity vectors on the map
            self.redraw(undefined, function() {return;});

        });

        return self;
    };


    VelocityView.prototype.redraw = function redraw(callback, shouldAbort) {
        var self = this;

        // If we haven't been added to a map we don't bother redrawing
        if (!self.mapView || !self.points.length) {
            return self;
        }

        var options = {frame: self.mapView.currentFrame,
                       points: self.points,
                       mapScale: self.mapView.mapScale()};
        self.vfs.withVelocityFrame(options, function(data) {
            if (shouldAbort()) {
                return self;
            }
            var old = self.displayPoints;
            self.updateDisplayPoints();
            var latLngBounds = self.mapView.map.getBounds();
            selectVectors(latLngBounds, self.displayPoints, old,
                          self.allVectors, self.vectorGroup, shouldAbort);
            drawVectors(latLngBounds, data, self.vectorGroup, shouldAbort);
            callback && callback(data);
        });
        return self;
    };


    VelocityView.prototype.updateDisplayPoints = function updateDisplayPts() {
        var self = this;
        var density = self.vectorDensity;
        var nPoints = self.points.length;
        var zoom = self.mapView.map.getZoom();
        var minZoom = self.mapView.minZoom;
        var scale = Math.pow(4, zoom - minZoom);
        var n = Math.min(Math.ceil(density * scale), nPoints);
        // console.log('show', n, 'at zoom level', zoom);
        self.displayPoints = n;
    };


    return {
        velocityView: function velocityView(config) {
            return new VelocityView(config);
        }
    };


    // Private Functions

    function selectVectors(
            latLngBounds, displayPoints, oldDisplayPoints,
            allVectors, vectorGroup, shouldAbort) {
        if (displayPoints > oldDisplayPoints) {
            // console.log(oldDisplayPoints + ' -> ' + displayPoints);
            allVectors.slice(oldDisplayPoints, displayPoints)
                .forEach(function(l) {
                    if (shouldAbort()) { return; }
                    vectorGroup.addLayer(l);
                });
        } else if (displayPoints < oldDisplayPoints) {
            // console.log(oldDisplayPoints + ' -> ' + displayPoints);
            allVectors.slice(displayPoints, oldDisplayPoints)
                .forEach(function(l) {
                    if (shouldAbort()) { return; }
                    vectorGroup.removeLayer(l);
                });
        }
    }


    function drawVectors(latLngBounds, velocityFrames, vectorGroup,
                         shouldAbort) {
        var latLngs = velocityFrames.vectors;
        var i = 0;
        vectorGroup.eachLayer(function _redraw(layer) {
            if (shouldAbort()) {return;}
            var idx = i++;
            if (latLngBounds.intersects(layer.getBounds())) {
                layer.setLatLngs(latLngs[idx]);
            }
        });
    }

}(jQuery, L, Models, Config));
