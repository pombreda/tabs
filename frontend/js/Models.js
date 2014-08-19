Models = {}
Models.vectorFrameSource = (function($, Trig) {

    var defaults = {
        barbLocation: 'head',
        barbDescriptions: {tail: 0, center: 0.5, head: 1.0},
        arrowHeadSize: 0.15,
        arrowHeadAngle: 60 * Math.PI / 180
    };

    function VectorFrameSource(config) {
        $.extend(this, defaults, config);
        this._vector_frames = {};
        this.setBarbLocation(this.barbLocation);
    };


    // parse the velocity vectors and return lines in lat/lon space
    VectorFrameSource.prototype._getDataSnapshot = function _getDataSnapshot(
            points, scale, velocityVectors) {
        var nPoints = points.length;
        var vectors = new Array(nPoints);
        for (var i = 0; i < nPoints; i++) {
            var dlat = velocityVectors.v[i] * scale * 0.5;
            var dlon = velocityVectors.u[i] * scale * 0.5;
            var endpoint = [points[i][0] + dlat, points[i][1] + dlon];

            var barb = make_barb(points[i], endpoint, this.barbPosition,
                                 this.arrowHeadSize, this.arrowHeadAngle);
            // Ideally we'd push the arrow and barb separately, but we really
            // need to draw the arrow in one stroke for performance reasons
            var arrow = [barb[0], barb[1], barb[2], barb[1],
                         endpoint, points[i]];
            vectors[i] = arrow;
        }
        date = velocityVectors.date;
        return {date: date, vectors: vectors};
    };

    VectorFrameSource.prototype.setBarbLocation = function setBarbLocation(
            barbLocation) {
        this.barbPosition = barbPositionFrom(
            this.barbDescriptions[barbLocation]);
    };

    VectorFrameSource.prototype.withGridLocations = function withGridLocations(
            callback) {
        API.withJSON('json_data/grd_locations.json', function(data) {
            var nPoints = data['lat'].length;
            var points = new Array(nPoints);
            for (var i = 0; i < nPoints; i++) {
                points[i] = [data.lat[i], data.lon[i]];
            }
            callback(points);
        });
    };

    VectorFrameSource.prototype.withVectorFrame = function withVectorFrame(
            frame, points, scale, callback) {
        var self = this;
        if (this._vector_frames[scale] === undefined) {
            this._vector_frames[scale] = [];
        }
        if (this._vector_frames[scale][frame] === undefined) {
            API.withVectorFrameJSON(frame, function(obj) {
                var vector_frame = self._getDataSnapshot(points, scale, obj);
                self._vector_frames[scale][frame] = vector_frame;
                callback(vector_frame);
            });
        } else {
            callback(self._vector_frames[scale][frame]);
        }
    };

    return function vectorFrameSource(config) {
        return new VectorFrameSource(config);
    };


    // Private functions

    function make_barb(
            start, end, barbPosition, arrowHeadSize, arrowHeadAngle) {
        barbPosition = barbPosition == undefined ? 1.0 : barbPosition;
        // Return the three points needed to put a 'barb' on a line segment
        // left tail, center, right tail
        var theta = Trig.relativeAngle(start, end);
        var lat = start[0] * (1 - barbPosition) + end[0] * barbPosition;
        var lon = start[1] * (1 - barbPosition) + end[1] * barbPosition;
        var p = Trig.rotate([[lat, lon]], -theta)[0];

        var dx2 = Math.pow(end[1] - start[1], 2);
        var dy2 = Math.pow(end[0] - start[0], 2);
        var length = Math.sqrt(dx2 + dy2) * arrowHeadSize;
        var arrowX = length * Math.cos(arrowHeadAngle);
        var arrowY = length * Math.sin(arrowHeadAngle);
        var lng = p[1] - arrowX;
        var latL = p[0] + arrowY;
        var latR = p[0] - arrowY;

        var barb_points = Trig.rotate([[latL, lng], p, [latR, lng]], theta);

        return barb_points;
    }

    function barbPositionFrom(barbLocation) {
        if (Number.isFinite(barbLocation)) {
            return Math.min(Math.max(barbLocation, 0), 1);
        } else {
            console.log('Invalid barbLocation (' + barbLocation + ')');
            return 1.0;
        }
    }

}(jQuery, Trig));
