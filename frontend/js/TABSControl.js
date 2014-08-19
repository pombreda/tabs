var TABSControl = (function() {

    Number.prototype.padLeft = function(width, chr) {
        var len = ((width || 2) - String(this).length) + 1;
        return len > 0 ? new Array(len).join(chr || '0') + this : this;
    };

    var monthStrings = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var defaults = {
        nFrames: 0
    };

    var TABSControl = L.Control.extend({

        initialize: function(options) {
            L.setOptions(this, defaults);
            L.setOptions(this, options);
            this.frame = 0;
            this.date = new Date();
        },

        onAdd: function(map) {
            this._map = map;

            // Steal the attribution CSS for now
            var classes = ['tabs-control',
                           'leaflet-control-attribution',
                           'leaflet-control'].join(' ');
            this.container = L.DomUtil.create('div', classes);

            // Toggle the run state
            this.container.onclick = this.options.onclick;

            this._map.on('viewreset', function() {
                showTimeStep(self.frame);
            });

            this._redraw();
            return this.container;
        },

        updateInfo: function(info) {
            if (info) {
                if (info.hasOwnProperty('frame')) {
                    this.frame = info.frame;
                }
                if (info.hasOwnProperty('date')) {
                    if (info.date[info.date.length - 1] != 'Z') {
                        info.date += 'Z';
                    }
                    this.date = new Date(Date.parse(info.date));
                }
                this._redraw();
            }
        },

        _redraw: function() {
            var nFrames = this.options.nFrames;
            this.container.innerHTML = (
                this._renderDate() + '<br/>' +
                'Frame: ' + this.frame.padLeft(2) + ' / ' + nFrames);
        },

        _renderDate: function() {
            var d = this.date;
            var day_month_year = [d.getUTCDate().padLeft(),
                                  monthStrings[d.getUTCMonth()],
                                  d.getFullYear()].join(' ');
            var hour_min = [d.getHours().padLeft(),
                            d.getMinutes().padLeft()].join(':');
            return day_month_year + '<br/>' + hour_min + ' UTC';
        }
    });


    return {
        tabsControl: function(options) {
            return new TABSControl(options);
        }
    };

}());
