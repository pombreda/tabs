import json
from threading import Timer

from flask import Flask, redirect, url_for

from tabs import vector_frame

app = Flask(__name__)


# We should probably maintain a connection for at least a short while
class THREDDS_CONNECTION(object):

    def __init__(self, url):
        self._url = url
        self._mch = None
        self._timer = None

    def _forget(self):
        self._timer = None
        self._mch = None

    def _reset_timer(self):
        if self._timer:
            self._timer.cancel()
        self._timer = Timer(10, self._forget)

    @property
    def mch(self):
        if not self._mch:
            self._mch = vector_frame.mch_animation(self._url)
        self._reset_timer()
        return self._mch


tc = THREDDS_CONNECTION(vector_frame.data_file)


@app.route('/')
def index():
    return redirect(url_for('static', filename='tabs.html'))


@app.route('/data/thredds/step/<time_step>')
def thredds_vector_frame(time_step):
    v = tc.mch.plot_vector_surface(time_step)
    return json.dumps(v)


@app.route('/data/prefetched/step/<time_step>')
def static_vector_frame(time_step):
    """ Return static JSON data for a time step """
    filename = 'json_data/step{}.json'.format(time_step)
    return redirect(url_for('static', filename=filename))


@app.route('/data/prefetched/grid')
def static_grid():
    """ Return the grid locations """
    filename = 'json_data/grd_locations.json'
    return redirect(url_for('static', filename=filename))

if __name__ == '__main__':
    app.run(debug=True)
