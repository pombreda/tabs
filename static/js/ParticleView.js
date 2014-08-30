var ParticleView = (function($, L, Models, Config) {

    var defaults = {

        // layer containing particle icons
        particleGroup: L.layerGroup([]),

        // The locations of the data points
        points: [],

        // Icon parameters
	iconSize: [16, 16],

    };


    var ParticleView = function ParticleView(config) {

        $.extend(this, defaults, config);

        this.vfs = Models.particleFrameSource({
        });
    };


    ParticleView.prototype.addTo = function addTo(mapView) {
        var self = this;

        this.mapView = mapView;

        mapView.layerSelectControl.addToggledOverlay(
            'particles', self.particleGroup, 'Particles');

        if (self.mapView.visibleLayers.particles) {
            self.particleGroup.addTo(mapView.map);
        }

        self.vfs.withParticleFrame({}, function(data) {
            // FIXME: just show static tracks
            L.geoJson(data, {}).addTo(mapView.map);
        });

        return this;
    };


    ParticleView.prototype.redraw = function redraw(callback) {
        var self = this;

	console.log('redraw');
        // If we haven't been added to a map we don't bother redrawing
        if (!self.mapView || !self.points.length) {
            return this;
        }

        var options = {frame: self.mapView.currentFrame,
                       points: self.points,
                       mapScale: self.mapView.mapScale()};
        self.vfs.withParticleFrame(options, function(data) {
            drawVectors(data, self.vectorGroup);
            callback && callback(data);
        });
    };


    return {
        particleView: function particleView(config) {
            return new ParticleView(config);
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
