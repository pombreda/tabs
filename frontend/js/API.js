API = (function($) {

    var _json = {};

    function urlForFrame(frame) {
        return 'json_data/step' + frame + '.json';
    }

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



    return {
        withJSON: withJSON,
        withVectorFrameJSON: withVectorFrameJSON
    };

}(jQuery));
