MapView = (function($, L, Models, Config) {

    var defaults = {

        visibleLayers: Config.visibleLayers,

        // Speed of animation (larger is slower)
        delay: Config.delay,

        // Does the animation automatically start?
        isRunning: Config.isRunning,

        // Number of time steps to use
        nFrames: Config.nFrames,

        // Initial zoom level
        minZoom: Config.minZoom,
        defaultZoom: Config.defaultZoom,
        maxZoom: Config.maxZoom,
        mapCenter: Config.mapCenter,

        tileLayerURL: Config.tileLayerURL,

        attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',

        // Outline of the region of interest
        domainURL: Config.domainURL

    };


    var MapView = function MapView(config) {

        var self = this;

        $.extend(self, defaults, config);

        self.currentFrame = 0;
        self.loadingFrame = -1;
        self.loadingCount = 0;

        var mapboxTiles = L.tileLayer(self.tileLayerURL, {
            attribution: self.attribution,
            maxZoom: self.maxZoom,
            minZoom: self.minZoom
        });

        // Leaflet map object
        self.map = L.map('map', {center: self.mapCenter,
                                 zoom: self.defaultZoom,
                                 layers: [mapboxTiles]});

        // Re-render when map conditions change
        self.map.on('viewreset', function() {
            if (!self.isRunning) {
                self.redraw(undefined, function() {return;});
            }
        });


        // Add map components
        self.tabsControl = new TABSControl.tabsControl({
            nFrames: self.nFrames,
            onclick: function onclick() {
                self.isRunning ? self.stop() : self.start();
            }
        });
        self.tabsControl.addTo(self.map);

        self.sliderControl = L.control.sliderControl({
            position: "bottomright",
            minValue: 0,
            maxValue: self.nFrames,
            slide: function(e, ui) {self.showTimeStep(ui.value);}
        });
        self.map.addControl(self.sliderControl);
        self.sliderControl.startSlider();

        self.distanceScaleControl = L.control.scale(
            Config.distanceScaleOptions).addTo(self.map);

        // Add layer selector and hook up toggling of visibility flag
        var lsc = self.layerSelectControl = L.control.layers([], [],
            {position: 'topleft'}).addTo(self.map);
        lsc.addToggledOverlay = function addToggledOverlay(key, layer, name) {
            lsc.addOverlay(layer, name);
            self.map.on(
                'overlayadd', _setLayerVisibility(self, key, layer, true));
            self.map.on(
                'overlayremove', _setLayerVisibility(self, key, layer, false));
        };

        // Add visualization layers
        self.saltView = SaltView.saltView(config).addTo(self);
        self.velocityView = VelocityView.velocityView(config).addTo(self);

        self.redraw(undefined, function() {return;});

        // Register hotkeys
        window.onkeypress = function startStop(oKeyEvent) {
            if (oKeyEvent.charCode === 32) {
                self.isRunning ? self.stop() : self.start();
            }
        };

    };


    MapView.prototype.mapScale = function mapScale() {
        var self = this;
        var scale = 0.5;     // vector scaling (m/s -> degrees) at default zoom
        var zoom = self.map.getZoom();
        return scale * Math.pow(2, self.defaultZoom - zoom);
    };


    // hard-coded region of interest outline
    MapView.prototype.addRegionOutline = function addRegionOutline() {
        var self = this;
        var featureLayer = L.mapbox.featureLayer()
            .loadURL(self.domainURL)
            .on('ready', function(layer) {
                self.eachLayer(function(poly) {
                    poly.setStyle({
                        color: 'red',
                        fill: false
                    });
                });
            })
            .addTo(self.map);
    };


    MapView.prototype.isLoading = function isLoading(i, start_or_stop) {
        var self = this;
        if (self.loadingFrame === -1) {
            console.log("begin loading " + i);
            self.loadingFrame = i;
        }
        var owns = self.loadingFrame === i;
        if (owns) {
            if (start_or_stop === 'start') {
                console.log("incr loading " + i);
                self.loadingCount += 1;
            } else if (start_or_stop === 'stop') {
                console.log("decr loading " + i);
                self.loadingCount -= 1;
            }
            if (self.loadingCount < 1) {
                console.log("end loading " + i);
                self.loadingFrame = -1;
            }
        }
        return owns;
    };


    // update vector data at each time step
    MapView.prototype.showTimeStep = function showTimeStep(i, callback) {
        var self = this;
        self.currentFrame = i;
        self.sliderControl.value(i);
        function shouldAbort(start_or_stop) {
            var isLoading = self.isLoading(i, start_or_stop);
            var condition = i !== self.currentFrame && !isLoading;
            return condition;
        }
        self.redraw(callback, shouldAbort);
    };


    MapView.prototype.start = function start() {
        var self = this;
        self.isRunning = true;
        self.t = Date.now();
        self._run();
    };


    MapView.prototype._run = function _run() {
        var self = this;
        if (self.isRunning) {
            var t = Date.now();
            self.currentFrame = (self.currentFrame + 1) % self.nFrames;
            self.showTimeStep(self.currentFrame, function() {
                var waitTime = Math.max(0, self.delay - (Date.now() - t));

                // XXX: Remove eventually
                if (showFPS && ((self.currentFrame % showFPS) === 0)) {
                    var fps = showFPS / ((t - self.t) / 1000);
                    var fps = fps.toFixed(2) + ' FPS';
                    var ms = waitTime.toFixed(0) + '/' + self.delay + 'ms';
                    console.log(fps + '\tdelay: ' + ms);
                    self.t = t;
                }

                setTimeout(function() {self._run()}, waitTime);
            });
        }
    };


    MapView.prototype.stop = function stop() {
        var self = this;
        self.isRunning = false;
    };


    MapView.prototype.redraw = function(callback, shouldAbort) {
        var self = this;
        setTimeout(function redraw() {
            console.log(self.visibleLayers);
            if (self.visibleLayers.velocity && !shouldAbort("start")) {
                self.velocityView && self.velocityView.redraw(
                    function vv_call(data) {
                        if (shouldAbort()) { return; }
                        self.tabsControl && self.tabsControl.updateInfo(
                            {frame: self.currentFrame, date: data.date});
                        shouldAbort("stop");
                        callback && callback(data);
                    },
                    shouldAbort
                );
            }

            if (self.visibleLayers.salinity && !shouldAbort("start")) {
                self.saltView && self.saltView.redraw(
                    function salt_call(data) {
                        if (shouldAbort()) { return ; }
                        self.tabsControl && self.tabsControl.updateInfo(
                            {frame: self.currentFrame, date: data.date,
                             numSaltLevels: self.saltView.numSaltLevels});
                        shouldAbort("stop");
                        callback && callback(data);
                    },
                    shouldAbort
                );
            }
            }, 10);
    }


    return {
        mapView: function mapView(config) { return new MapView(config); }
    };


    // Private functions

    function _setLayerVisibility(mapView, key, layer, value) {
        function setLayerVisibilityInner(e) {
            if (e.layer === layer) {
                mapView.visibleLayers[key] = value;
                mapView.redraw(undefined, function() {return;});
            }
        }
        return setLayerVisibilityInner;
    };

}(jQuery, L, Models, Config));
