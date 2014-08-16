from flask import Flask, redirect, url_for

app = Flask(__name__)


@app.route('/')
def index():
    return redirect(url_for('static', filename='tabs.html'))

@app.route('/data/prefetched/step/<time_step>')
def prefetched(time_step):
    """ Return static JSON data for a time step """
    filename = 'json_data/step{}.json'.format(time_step)
    return redirect(url_for('static', filename=filename))

@app.route('/data/prefetched/grid')
def grid():
    """ Return the grid locations """
    filename = 'json_data/grd_locations.json'
    return redirect(url_for('static', filename=filename))

if __name__ == '__main__':
    app.run(debug=True)
