import json
from threading import Timer, RLock

from flask import Flask, redirect, url_for

from tabs import vector_frame

app = Flask(__name__)


# We should probably maintain a connection for at least a short while
class THREDDS_CONNECTION(object):

    def __init__(self, timeout=60, **mch_args):
        """ Create an expiring connection to the THREDDS server.

        The connection will drop after 60 seconds of non-use. Any subsequent
        attempt to use the connection will initiate a new one. Access to the
        connection is RLock'd to ensure only one connection is alive at a time.

        Parameters:
        timeout : int, seconds
            The lenght of time in seconds to hold open a connection.

        Remaining keyword args are passed to the connection's constructor.
        """
        self._mch = None
        self._mch_lock = RLock()
        self._mch_args = mch_args
        self._timer = None
        self.timeout = float(timeout)

    def _forget(self):
        app.logger.info("Closing THREDDS connection")
        if self._timer:
            self._timer.cancel()
            self._timer = None
        self._mch = None

    def _reset_timer(self):
        app.logger.info("Resetting THREDDS connection timer")
        if self._timer:
            self._timer.cancel()
        self._timer = Timer(self.timeout, self._forget)
        self._timer.start()

    def mch():
        doc = "The mch property."

        def fget(self):
            with self._mch_lock:
                if not self._mch:
                    app.logger.info("Opening new THREDDS connection")
                    self._mch = vector_frame.mch_animation(**self._mch_args)
                self._reset_timer()
                return self._mch

        def fset(self, value):
            with self._mch_lock:
                self._mch = value
                return self.mch

        def fdel(self):
            with self._mch_lock:
                self._forget()
        return locals()
    mch = property(**mch())


tc = THREDDS_CONNECTION(data_uri=vector_frame.DEFALUT_DATA_URI)


@app.route('/')
def index():
    return redirect(url_for('static', filename='tabs.html'))


@app.route('/data/thredds/step/<int:time_step>')
def thredds_vector_frame(time_step):
    vector = tc.mch.plot_vector_surface(time_step)
    vector['u'] = vector['u'].round(4).tolist()
    vector['v'] = vector['v'].round(4).tolist()
    return json.dumps(vector)


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
