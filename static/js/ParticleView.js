var ParticleView = (function($, L, Models, Config) {

    var defaults = {

        // layer containing particle icons
        particleGroup: L.layerGroup([]),

        // The linestrings representing particle tracks
        tracks: [],

        // Icon parameters for a normal particle
	goodMarkerOptions: {
            color: 'black',
            fillOpacity: 1.0,
        },

        // Icon parameters for a particle that has left the domain
	badMarkerOptions: {
            color: 'gray',
            fillOpacity: 1.0,
        },

        markerRadius: 1,

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
            self.tracks = data.coordinates;
            for (var i = 0; i < self.tracks.length; i++) {
                var lon = self.tracks[i][0][0];
                var lat = self.tracks[i][0][1];
                var marker = L.circleMarker(
                    [lat, lon], self.goodMarkerOptions
                ).setRadius(self.markerRadius);
                self.particleGroup.addLayer(marker);
            }
            // show static tracks
            //L.geoJson(data, {}).addTo(mapView.map);
        });

        return this;
    };


    ParticleView.prototype.redraw = function redraw(callback) {
        var self = this;

        // If we haven't been added to a map we don't bother redrawing
        if (!self.mapView || !self.tracks.length) {
            return this;
        }

        var options = {frame: self.mapView.currentFrame,
                       tracks: self.tracks,
                       goodMarkerOptions: self.goodMarkerOptions,
                       badMarkerOptions: self.badMarkerOptions,
                       mapScale: self.mapView.mapScale()};
        updateParticles(options, self.particleGroup);
        callback && callback(null);
    };


    return {
        particleView: function particleView(config) {
            return new ParticleView(config);
        }
    };


    // Private Functions

    function updateParticles(options, group) {
        if (group) {
            var frame = options.frame;
            group.eachLayer(function _redraw(layer) {
                var track = this.tracks[this.i++];
                if (track.length < frame + 1) {
                    layer.setStyle(options.badMarkerOptions);
                } else {
                    lon = track[frame][0];
                    lat = track[frame][1];
                    layer.setLatLng([lat, lon]);
                    layer.setStyle(options.goodMarkerOptions);
                }
            }, {tracks: options.tracks, i: 0});
        }
    }


}(jQuery, L, Models, Config));
