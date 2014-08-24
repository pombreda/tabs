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


    return {
        withJSON: withJSON,
        withVelocityFrameJSON: withVelocityFrameJSON,
        withVelocityGridLocationsJSON: withVelocityGridLocationsJSON,
    };


    // Private functions

    function urlForVelocityFrame(frame) {
        url = Config.velocityFrameURL;
        return url + frame;
    }


}(Config, jQuery));
