
var Config = {
    // API
    gridLocationsURL: '/data/thredds/grid',
    vectorFrameURL: '/data/thredds/step/',
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

    // Start animation immediately?
    isRunning: true,

    // number of time steps to use
    // nFrames: 90,
    nFrames: 6

};
