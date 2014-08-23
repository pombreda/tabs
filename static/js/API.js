API = (function(Config, $) {

    var _json = {};

    function withJSON(url, callback) {
        if (_json[url] == undefined) {
            $.getJSON(url, function(json) {
                _json[url] = json;
                callback(json);
            });
        } else {
            callback(_json[url]);
        }
    }

    function withVelocityFrameJSON(frame, callback) {
        withJSON(urlForVelocityFrame(frame), callback);
    }


    function withVelocityGridLocationsJSON(callback) {
        withJSON(Config.velocityGridLocationsURL, callback);
    }

    function withSaltFrameJSON(frame, callback) {
        withJSON(urlForSaltFrame(frame), callback);
    }

    return {
        withJSON: withJSON,
        withVelocityFrameJSON: withVelocityFrameJSON,
        withVelocityGridLocationsJSON: withVelocityGridLocationsJSON,
        withSaltFrameJSON: withSaltFrameJSON
    };


    // Private functions

    function urlForVelocityFrame(frame) {
        url = Config.velocityFrameURL;
        return url + frame;
    }

    function urlForSaltFrame(frame) {
        url = Config.saltFrameURL;
        return url + frame;
    }

}(Config, jQuery));
