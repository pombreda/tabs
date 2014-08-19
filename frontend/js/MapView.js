MapView = (function($, L, Models) {

    var defaults = {

        // speed of animation (larger is slower)
        delay: 90,

        // global layer to update vector multiPolylines
        vectorGroup: L.layerGroup([]),

        isRunning: true,

        // The locations of the data points
        points: [],

        // number of time steps to use
        nFrames: 90,

        // initial zoom level
        minZoom: 7,
        defaultZoom: 7,
        maxZoom: 11,

        // Position of the barbs on the arrows ('head', 'center', 'tail')
        barbLocation: 'head',

        // Fraction of vector length to make arrow strokes
        arrowHeadSize: 0.15,

        // Degrees!
        arrowHeadAngle: 60,

        tileLayerURL: 'https://{s}.tiles.mapbox.com/v3/tabs-enthought.j3nibphe/{z}/{x}/{y}.png',

        attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',

        _domain_url: 'json_data/domain.json'

    };

    var MapView = function(config) {

        var self = this;

        $.extend(this, defaults, config);

        this.currentFrame = 0;

        // Convert to radians
        this.arrowHeadAngle *= Math.PI / 180;

        var mapboxTiles = L.tileLayer(this.tileLayerURL, {
            attribution: this.attribution,
            maxZoom: this.maxZoom,
            minZoom: this.minZoom
        });

        // Leaflet map object
        this.map = L.map('map', {center: [27, -94],
                                 zoom: this.defaultZoom,
                                 layers: [mapboxTiles]});

        // Re-render when map conditions change
        this.map.on('viewreset', function() {
            if (!self.isRunning) {
                self.redraw();
            }
        });


        this.tabsControl = new TABSControl.tabsControl({
            nFrames: this.nFrames,
            onclick: function onclick() {
                self.isRunning ? self.stop() : self.start();
            }
        });
        this.tabsControl.addTo(this.map);
        window.onkeypress = function startStop(oKeyEvent) {
            if (oKeyEvent.charCode === 32) {
                mapView.tabsControl.options.onclick();
            }
        };

        this.vfs = Models.vectorFrameSource({
            barbLocation: this.barbLocation,
            arrowHeadSize: this.arrowHeadSize,
            arrowHeadAngle: this.arrowHeadAngle});

        // put the initial velocity vectors on the map
        this.vfs.withGridLocations(function(points) {
            self.points = points;
            self.addVectorLayer(self.points);
            self.showTimeStep(0);
        });

    };

    // add a vector layer to the map at the initial grid points
    MapView.prototype.addVectorLayer = function addVectorLayer(points) {
        var self = this;

        var vectorStyle = {
            color: 'black',
            weight: 1
        };

        this.vfs.withVectorFrame(
                0, points, this.mapScale(), function(data) {
            var vectors = data.vectors;
            var lines = [];
            for (var i = 0; i < vectors.length; i++) {
                var line = L.polyline(vectors[i], vectorStyle);
                lines.push(line);
                self.vectorGroup.addLayer(line);
            }
            self.vectorGroup.addTo(mapView.map);
            self._vector_layers = self.vectorGroup.getLayers();
        });
    };

    MapView.prototype.mapScale = function mapScale() {
        var scale = 0.5;     // vector scaling (m/s -> degrees) at default zoom
        var zoom = this.map.getZoom();
        return scale * Math.pow(2, this.defaultZoom - zoom);
    };

    // hard-coded region of interest outline
    MapView.prototype.addRegionOutline = function addRegionOutline() {
        var featureLayer = L.mapbox.featureLayer()
            .loadURL(this._domain_url)
            .on('ready', function(layer) {
                this.eachLayer(function(poly) {
                    poly.setStyle({
                        color: 'red',
                        fill: false
                    });
                });
            })
            .addTo(this.map);
    };

    // update vector data at each time step
    MapView.prototype.showTimeStep = function showTimeStep(i) {
        this.currentFrame = i;
        this.redraw();
    };

    MapView.prototype.start = function start() {
        this.isRunning = true;
        this._run();
    };

    MapView.prototype._run = function _run() {
        var self = this;
        if (this.isRunning) {
            var t = Date.now();
            this.showTimeStep(this.currentFrame);
            this.currentFrame = (this.currentFrame + 1) % this.nFrames;
            var waitTime = Math.max(0, this.delay - (Date.now() - t));
            setTimeout(function() {self._run()}, waitTime);
        }
    };

    MapView.prototype.stop = function stop() {
        this.isRunning = false;
    };

    MapView.prototype.redraw = function redraw(callback) {
        var self = this;
        var i = self.currentFrame;
        self.vfs.withVectorFrame(i, self.points, self.mapScale(),
            function(data) {
                drawVectors(
                    data, self._vector_layers, self.tabsControl);
                self.tabsControl.updateInfo({frame: i, date: data.date});
                callback && callback(data);
            }
        );
    };


    return {
        mapView: function mapView(config) { return new MapView(config); }
    };


    // Private Functions

    function drawVectors(data, lines) {
        setTimeout(function() {
            var latLngs = data.vectors;
            for (var j = 0; j < lines.length; j++) {
                lines[j].setLatLngs(latLngs[j]);
            }
        }, 0);
    }



}(jQuery, L, Models));
