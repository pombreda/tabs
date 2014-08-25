
var Config = {

    // API
    velocityGridLocationsURL: '/data/thredds/velocity/grid',
    velocityFrameURL: '/data/thredds/velocity/step/',
    domainURL: '/data/prefetched/domain',
    tileLayerURL: 'https://{s}.tiles.mapbox.com/v3/tabs-enthought.j3nibphe/{z}/{x}/{y}.png',

    // Vector style
    barbLocation: 'head',
    barbDescriptions: {tail: 0, center: 0.5, head: 1.0},
    arrowHeadSize: 0.15,
    arrowHeadAngle: 60,

    // Map view config
    minZoom: 7,
    defaultZoom: 7,
    maxZoom: 11,

    // Pause between frames (in ms)
    delay: 90,

    // Does the animation automatically start?
    isRunning: true,

    // Number of time steps to use
    nFrames: 90,

    // Distance scale configuration
    distanceScaleOptions: {
        // The position of the control (one of the map corners).
        // ('top' x 'bottom') + ('left' x 'right')
        position: 'bottomleft',
        // Maximum width of the control in pixels.
        maxWidth: 400,
        // Whether to show the metric scale line (m/km).
        metric: true,
        // Whether to show the imperial scale line (mi/ft).
        imperial: true,
        // If true, the control is only updated after the map has stopped
        // moving, otherwise it's always up-to-date (updated on move).
        updateWhenIdle: false
    },

    // Which data is shown by default?
    display: {
        velocity: true
    }

};
