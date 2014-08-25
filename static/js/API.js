API = (function(Config, $) {

    var _json = {};

    function withJSON(url, callback) {
        if (_json[url] == undefined) {
            $.getJSON(url, function(json) {
                _json[url] = json;
                if (callback === undefined) console.log('Callback undefined');
                callback && callback(json);
            });
        } else {
            callback(_json[url]);
        }
    }

    function withVelocityFrameJSON(frame, callback) {
        if (callback === undefined) console.log('Callback undefined');
        withJSON(urlForVelocityFrame(frame), callback);
    }


    function withVelocityGridLocationsJSON(callback) {
        if (callback === undefined) console.log('Callback undefined');
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
