import datetime
import numpy as np
import netCDF4 as netCDF
import os
from shapely.geometry import LineString, MultiLineString
import json

# set matplotlib backend before importing tracpy to avoid warnings
import matplotlib
matplotlib.use("Agg")

import tracpy
from tracpy.tracpy_class import Tracpy

from thredds_frame_source import TABS_DATA_URI


def run_tracpy(year=2003, month=1, day=3, hour=16, ndays=15):
    loc = TABS_DATA_URI

    # Start date in date time formatting
    date = datetime.datetime(year, month, day, hour)

    # Time between outputs
    tseas = 4*3600 # 4 hours between outputs, in seconds 

    # Time units
    time_units = 'seconds since 1970-01-01'
    # Sets a smaller limit than between model outputs for when to force
    # interpolation if hasn't already occurred.
    nsteps = 5
    # Controls the sampling frequency of the drifter tracks.
    N = 1
    # Use ff = 1 for forward in time and ff = -1 for backward in time.
    ff = 1
    ah = 0. # m^2/s
    av = 0. # m^2/s

    # turbulence/diffusion flag
    doturb = 0
    # simulation name, used for saving results into netcdf file
    name = 'temp'
    # for 3d flag, do3d=0 makes the run 2d and do3d=1 makes the run 3d
    do3d = 0

    ## Choose method for vertical placement of drifters
    z0 = 's'
    num_layers = 30
    zpar = num_layers-1
    # Initialize Tracpy class
    tp = Tracpy(loc, name=name, tseas=tseas, ndays=ndays, nsteps=nsteps, usebasemap=True,
                N=N, ff=ff, ah=ah, av=av, doturb=doturb, do3d=do3d, z0=z0, zpar=zpar, time_units=time_units)
    # read in grid
    tp._readgrid()
    # Input starting locations as real space lon,lat locations
    lon0, lat0 = np.meshgrid(np.linspace(-98.5,-87.5,55), \
                                np.linspace(22.5,31,49)) # whole domain, 20 km

    # Eliminate points that are outside domain or in masked areas
    lon0, lat0 = tracpy.tools.check_points(lon0, lat0, tp.grid)
    # Note in timing that the grid was already read in
    lonp, latp, zp, t, T0, U, V = tracpy.run.run(tp, date, lon0, lat0)
    return lonp, latp


def tracks_to_geojson(lonp, latp):
    """Output particle tracks to GeoJSON """
    multiline = MultiLineString([LineString(zip(lo[~np.isnan(lo)], la[~np.isnan(la)])) for lo, la in zip(lonp, latp) if len(lo[~np.isnan(lo)]) > 1])
    return json.dumps(multiline.__geo_interface__)


def tracker(ndays=15):
    lonp, latp = run_tracpy(ndays=ndays)
    return tracks_to_geojson(lonp, latp)


if __name__ == '__main__':
    JSON_OUT_FILE = os.path.join(os.path.dirname(__file__),
                                '../static/data/json/tracks_short.json')
    geojson = tracker(ndays=1)
    with open(JSON_OUT_FILE, 'w') as out:
        out.write(geojson)
