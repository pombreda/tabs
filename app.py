import json
from threading import Timer, RLock

import numpy as np
from flask import Flask, redirect, url_for

from tabs import thredds_vector_frame_source

app = Flask(__name__)


# We should probably maintain a connection for at least a short while
class THREDDS_CONNECTION(object):

    def __init__(self, timeout=60, **vfs_args):
        """ Create an expiring connection to the THREDDS server.

        The connection will drop after 60 seconds of non-use. Any subsequent
        attempt to use the connection will initiate a new one. Access to the
        connection is RLock'd to ensure only one connection is alive at a time.

        Parameters:
        timeout : int, seconds
            The lenght of time in seconds to hold open a connection.

        Remaining keyword args are passed to the connection's constructor.
        """
        self._vfs = None
        self._vfs_lock = RLock()
        self._vfs_args = vfs_args
        self._timer = None
        self.timeout = float(timeout)

    def _forget(self):
        app.logger.info("Closing THREDDS connection")
        if self._timer:
            self._timer.cancel()
            self._timer = None
        self._vfs = None

    def _reset_timer(self):
        app.logger.info("Resetting THREDDS connection timer")
        if self._timer:
            self._timer.cancel()
        self._timer = Timer(self.timeout, self._forget)
        self._timer.start()

    def vfs():
        doc = "The vfs property."

        def fget(self):
            with self._vfs_lock:
                if not self._vfs:
                    app.logger.info("Opening new THREDDS connection")
                    cls = thredds_vector_frame_source.THREDDSVectorFrameSource
                    self._vfs = cls(**self._vfs_args)
                self._reset_timer()
                return self._vfs

        def fset(self, value):
            with self._vfs_lock:
                self._vfs = value
                self._reset_timer()
                return self._vfs

        def fdel(self):
            with self._vfs_lock:
                self._forget()
        return locals()
    vfs = property(**vfs())


tc = THREDDS_CONNECTION(data_uri=thredds_vector_frame_source.DEFAULT_DATA_URI,
                        decimate_factor=60)


def jsonify_dict_of_array(obj):
    obj = obj.copy()
    for k in obj:
        if isinstance(obj[k], np.ndarray):
            obj[k] = obj[k].round(4).tolist()
    return obj


@app.route('/')
def index():
    return redirect(url_for('static', filename='tabs.html'))


@app.route('/data/thredds/grid')
def thredds_grid():
    return json.dumps(jsonify_dict_of_array(tc.vfs.grid))


@app.route('/data/thredds/step/<int:time_step>')
def thredds_vector_frame(time_step):
    vs = tc.vfs.plot_vector_surface(time_step)
    vs = jsonify_dict_of_array(vs)
    return json.dumps(vs)


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


@app.route('/data/prefetched/domain')
def domain():
    """ Return the domain outline """
    filename = 'json_data/domain.json'
    return redirect(url_for('static', filename=filename))

if __name__ == '__main__':
    app.run(debug=True)
