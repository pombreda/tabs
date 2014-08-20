# class for creating animations.

import matplotlib
matplotlib.use('Agg')

import os
import json

import numpy as np
from mpl_toolkits.basemap import Basemap
import netCDF4 as netCDF

from octant_lite import rot2d, shrink


# length of animation (number of frames)
NFRAMES = 90

# set output precision for JSON data
json.encoder.FLOAT_REPR = lambda o: format(o, '.4f')


class mch_animation(object):
    """docstring for MCH animation"""

    figsize = (8, 6)

    def __init__(self, ncfile, grdfile=None):
        self.ncfile = ncfile
        self.nc = netCDF.Dataset(ncfile)

        if grdfile is None:
            self.ncg = self.nc
        else:
            self.ncg = netCDF.Dataset(grdfile)

        self.dates = netCDF.num2date(self.nc.variables['ocean_time'][:],
                                     'seconds since 1970-01-01')

        self.basemap = Basemap(llcrnrlon=-95.1,
                               llcrnrlat=27.25,
                               urcrnrlon=-87.5,
                               urcrnrlat=30.95,
                               projection='lcc',
                               lat_0=30.0,
                               lon_0=-90.0,
                               resolution='i',
                               area_thresh=0.)

        self.frame = 0

    def new_frame(self, n):
        """docstring for new_frame"""
        self.n = n

    def close_frame(self):
        print(' ... wrote frame {}'.format(self.frame))
        self.frame += 1

    def plot_vector_surface(self):
        decimate_factor = 60

        if self.frame == 0:
            lon = self.ncg.variables['lon_psi'][:]
            lat = self.ncg.variables['lat_psi'][:]
            xv, yv = self.basemap(lon, lat)
            maskv = self.ncg.variables['mask_psi'][:]
            self.anglev = shrink(self.ncg.variables['angle'][:], xv.shape)
            idx, idy = np.where(maskv == 1.0)
            idv = np.arange(len(idx))
            np.random.shuffle(idv)
            Nvec = len(idx) / decimate_factor
            idv = idv[:Nvec]
            self.idx = idx[idv]
            self.idy = idy[idv]
            # save the grid locations as JSON file
            out_grdfile = 'grd_locations.json'
            grd = {'lon': lon[self.idx, self.idy].tolist(),
                   'lat': lat[self.idx, self.idy].tolist()}
            write_vector(grd, out_grdfile)

        u = self.nc.variables['u'][self.n, -1, :, :]
        v = self.nc.variables['v'][self.n, -1, :, :]
        u, v = shrink(u, v)
        u, v = rot2d(u, v, self.anglev)

        vector = {'date': self.dates[self.n].isoformat(),
                  'u': u[self.idx, self.idy].tolist(),
                  'v': v[self.idx, self.idy].tolist()}
        return vector

    def __del__(self):
        """docstring for __del__"""
        self.nc.close()
        self.ncg.close()


def write_vector(vector, outfile):
    """ Save vector data for a timestep as JSON """
    out_dir = os.path.join(os.path.dirname(__file__), 'json_data')
    if not os.path.exists(out_dir):
        os.mkdir(out_dir)
    filename = os.path.join(out_dir, outfile)
    with open(filename, 'w') as f:
        json.dump(vector, f)


def main():
    data_file = 'http://barataria.tamu.edu:8080/thredds/dodsC/NcML/txla_nesting6.nc'  # noqa
    mch = mch_animation(data_file)

    for tidx in range(NFRAMES):
        print(tidx)
        mch.new_frame(tidx)
        vector = mch.plot_vector_surface()
        write_vector(vector, 'step{}.json'.format(mch.n))
        mch.close_frame()


if __name__ == '__main__':
    main()
