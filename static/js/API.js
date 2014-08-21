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

    function withVectorFrameJSON(frame, callback) {
        withJSON(urlForFrame(frame), callback);
    }


    function withGridLocationsJSON(callback) {
        withJSON(Config.gridLocationsURL, callback);
    }


    return {
        withJSON: withJSON,
        withVectorFrameJSON: withVectorFrameJSON,
        withGridLocationsJSON: withGridLocationsJSON
    };


    // Private functions

    function urlForFrame(frame) {
        url = Config.vectorFrameURL;
        return url + frame;
    }


}(Config, jQuery));
