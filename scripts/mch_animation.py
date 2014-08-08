# class for creating animations.

import matplotlib
matplotlib.use('Agg')

import os

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.dates import date2num
from datetime import datetime, timedelta
from mpl_toolkits.basemap import Basemap
import netCDF4 as netCDF

import octant
import octant.roms

PATH = '/Users/kjordahl/tamu/MCH'


def bottom_o2_flux(temp=25.0, o2=np.inf):
    '''
    return bottom flux for a given bottom temperatute and oxygen

    Parameters
    ----------
    temp    array-like
           Bottom temperature in degrees C

    o2      array-like
           Bottom oxygen in uM

    Returns
    -------
    bflux   array-like
           Benthic o2 flux in uM/second
    '''

    return 6.0 * 2**(temp/10.0) * (1 - np.exp(-o2/30.0)) / 86400.0


class mch_animation(object):
    """docstring for MCH animation"""

    figsize = (8, 6)

    font_fixed = plt.matplotlib.font_manager.FontProperties()
    font_fixed.set_family('monospace')

    font_label_it = plt.matplotlib.font_manager.FontProperties()
    font_label_it.set_size(8)
    font_label_it.set_slant('oblique')

    font_label = plt.matplotlib.font_manager.FontProperties()
    font_label.set_size(8)

    cdict =   {'red':   ((0.00, 0.4,  0.4), 
                          (0.35, 0.3,  0.3), 
                          (0.66, 1.0,  1.0), 
                          (0.85, 0.9,  0.9),
                          (0.93, 0.75,  0.75),
                          (1.00, 0.83, 0.83)),
                'green': ((0.00,  0.4, 0.4), 
                          (0.125, 0.3, 0.3), 
                          (0.375, 1.0, 1.0), 
                          (0.64,  1.0, 1.0), 
                          (0.75,  0.5, 0.5), 
                          (0.93,  0.5, 0.5), 
                          (1.00,  0.8, 0.8)),
                'blue':  ((0.00, 0.7, 0.7), 
                          (0.11, 1.0, 1.0), 
                          (0.34, 1.0, 1.0), 
                          (0.65, 0.0, 0.0), 
                          (0.85,  0.6, 0.6), 
                          (1.00, 0.8, 0.8))}

    cmap = plt.matplotlib.colors.LinearSegmentedColormap('mod_jet',cdict,256)

    def __init__(self, year, ncfile, framedir, grdfile=None):
        self.ncfile = ncfile
        self.nc = netCDF.MFDataset(ncfile)
        self.framedir = framedir

        if grdfile is None:
            grdfile=ncfile

        self.ncg = netCDF.Dataset(grdfile)

        self.zr = octant.roms.nc_depths(self.nc, grid='rho')
        self.zw = octant.roms.nc_depths(self.nc, grid='w')

        try:
           self.dates = np.load(PATH + '/mch_dates.npy')
           print 'loaded mch_dates.npy'
        except:
           print 'loading dates from netcdf files'
           #t = octant.cf.time(self.nc, name='ocean_time')
           #self.dates = t.dates
           self.dates = netCDF.num2date(self.nc.variables['ocean_time'][:], 'seconds since 1970-01-01')
           self.dates.dump(PATH + '/mch_dates.npy')
           print 'saved mch_dates.npy'

        self.basemap = Basemap(llcrnrlon=-95.1,
                              llcrnrlat=27.25,
                              urcrnrlon=-87.5,
                              urcrnrlat=30.95,
                              projection='lcc',
                              lat_0=30.0,
                              lon_0=-90.0,
                              resolution ='i',
                              area_thresh=0.)
        self.year = year
        os.system('mkdir %s_%d' % (self.framedir, year))
        self.frame = 0

    def new_frame(self, n):
        """docstring for new_frame"""
        self.n = n

        # set up figure and axis
        self.fig = plt.figure(figsize=self.figsize)
        self.ax = self.fig.add_axes([-0.01, 0.27, 1.01, 0.73])

        self.basemap.drawcoastlines(linewidth=0.25, color='k')
        self.basemap.fillcontinents(color='0.7')
        self.basemap.drawmeridians(range(-97, -85, 1), labels=[0, 0, 0, 0],
                                  color='0.5', linewidth=0.25)
        self.basemap.drawparallels(range(25, 32, 1), labels=[0, 0, 0, 0],
                                  color='0.5', linewidth=0.25)


        # get and plot date
        datestr = self.dates[self.n].strftime('%Y %b %d %H:%M GMT')
        plt.text(0.02, 0.24, datestr+' ',
                fontproperties=self.font_fixed,
                horizontalalignment='left',
                verticalalignment='top',
                transform=self.fig.transFigure,
                fontsize=12)

    def filled_timeseries(self, dates, value):
        """docstring for filled_timeseries"""

        dateo = self.dates[self.n]
        idx = np.where(np.abs(dates-dateo) == \
                       np.min(np.abs(dates-dateo)))[0]
        idx = np.min(idx)

        self.tsax = self.fig.add_axes([0, 0, 1.0, .25])
        self.tsax.set_axis_off()
        t = date2num(dates)
        t_fill = np.hstack((t[0], t[:idx+1], t[idx]))
        v_fill = np.hstack((0, value[:idx+1], 0))
        self.tsax.fill(t_fill, v_fill, alpha=0.5, fc='b', ec='k')
        self.tsax.plot(t, value, '-k')
        self.tsax.plot([t.min(), t.max()], [10000, 10000], '-b', lw=0.5, alpha=0.5)
        self.tsax.plot([t.min(), t.max()], [20000, 20000], '-b', lw=0.5, alpha=0.5)
        self.tsax.plot([t.min(), t.max()], [30000, 30000], '-b', lw=0.5, alpha=0.5)

        self.tsax.text(t.max()-45, 10000, r'10,000', ha='left', va='bottom', fontproperties=self.font_label_it)
        self.tsax.text(t.max()-45, 20000, r'20,000', ha='left', va='bottom', fontproperties=self.font_label_it)
        self.tsax.text(t.max()-45, 30000, r'30,000 m$^3$ s$^{-1}$', ha='left', va='bottom', fontproperties=self.font_label_it)
        self.tsax.text(t.max()-50, 30000, r'Mississippi River Discharge', ha='right', va='bottom', fontproperties=self.font_label_it)

        self.tsax.set_xlim(t.min(), t.max())
        self.tsax.set_ylim(0, 40000)

    def add_wind_arrow(self, dates, Uwind, Vwind):

        dateo = self.dates[self.n]
        idx = np.where(np.abs(dates-dateo) == \
                       np.min(np.abs(dates-dateo)))[0]
        idx = np.min(idx)

        idx_month = np.where( (dates > dateo-timedelta(days=7)) & 
                             (dates < dateo) )[0]

        xo, yo = (650000, 60000.0)

        self.ax.quiver((xo,), (yo,), (Uwind[idx],), (Vwind[idx],), 
                      scale=100.0, pivot='middle',
                      zorder=1e35,
                      width=0.01, headlength=3, headaxislength=2.7,
                      color=(0.0, 0.5, 1.0), clip_on=False)

        Uwind_offset = Uwind[idx_month] * 3500.0 
        Vwind_offset = Vwind[idx_month] * 3500.0 

        self.ax.plot(xo+Uwind_offset, yo+Vwind_offset, 'o', color=(0.5, 0.5, 1.0), alpha=0.01, mec=None)

        for radius in [5, 10, 15]:
           circ = plt.Circle((xo, yo), radius*3500.0, ec=(0.8, 0.8, 1.0), fc='None')
           self.ax.add_artist(circ)

        self.ax.text(xo, yo+ 5.5*3500.0, r'5', ha='left', va='bottom', fontproperties=self.font_label_it)
        self.ax.text(xo, yo+10.5*3500.0, r'10', ha='left', va='bottom', fontproperties=self.font_label_it)
        self.ax.text(xo, yo+15.5*3500.0, r'15  m s$^{-1}$', ha='left', va='bottom', fontproperties=self.font_label_it)
        self.ax.text(xo, yo+20.0*3500.0, r'Wind Speed', ha='left', va='bottom', fontproperties=self.font_label_it)

    def close_frame(self):

        self.ax.set_axis_off()
        plt.savefig('%s_%d/frame_%04d.png' % (self.framedir, self.year, self.frame), dpi=100)
        print ' ... wrote frame ', self.frame
        self.frame += 1
        plt.close(self.fig)

    def plot_property_surface(self, propname, clabel, clim, cticks):

        h = self.ncg.variables['h'][:]
        lon = self.ncg.variables['lon_rho'][:]
        lat = self.ncg.variables['lat_rho'][:]
        x, y = self.basemap(lon, lat)

        mask = self.ncg.variables['mask_rho'][:]

        h = np.ma.masked_where(mask==0, h)
        plt.contour(x, y, h, [10, 20, 50, 100, 200], colors='0.5', linewidths=0.5)

        print 'property ', propname, self.n
        prop = self.nc.variables[propname][self.n][-1]
        prop = np.ma.masked_where(mask==0, prop)
        self.pc = self.ax.pcolor(x, y, prop, vmin=min(clim), vmax=max(clim), cmap=self.cmap)

        self.cax = self.fig.add_axes([0.05, 0.92, 0.5, 0.03])
        cb = plt.colorbar(self.pc, cax=self.cax, 
                          orientation='horizontal',
                          ticks=cticks)
        cb.set_label(clabel)

        self.basemap.set_axes_limits(ax=self.ax)

    def plot_property_bottom(self, propname, clabel, clim, cticks):

        h = self.ncg.variables['h'][:]
        lon = self.ncg.variables['lon_rho'][:]
        lat = self.ncg.variables['lat_rho'][:]
        x, y = self.basemap(lon, lat)

        mask = self.ncg.variables['mask_rho'][:]

        h = np.ma.masked_where(mask==0, h)
        plt.contour(x, y, h, [10, 20, 50, 100, 200], colors='0.5', linewidths=0.5)

        prop = self.nc.variables[propname][self.n, 0, :]
        prop = np.ma.masked_where(mask==0, prop)
        self.pc = self.ax.pcolor(x, y, prop, vmin=min(clim), vmax=max(clim), cmap=self.cmap)

        self.cax = self.fig.add_axes([0.05, 0.92, 0.5, 0.03])
        cb = plt.colorbar(self.pc, cax=self.cax, 
                          orientation='horizontal',
                          ticks=cticks)
        cb.set_label(clabel)

        self.basemap.set_axes_limits(ax=self.ax)

    def plot_hypoxia_timescales(self):

        h = self.ncg.variables['h'][:]
        sss = self.nc.variables['salt'][self.n, -1]
        lon = self.ncg.variables['lon_rho'][:]
        lat = self.ncg.variables['lat_rho'][:]
        x, y = self.basemap(lon, lat)

        mask = self.ncg.variables['mask_rho'][:]

        h = np.ma.masked_where(mask==0, h)
        plt.contour(x, y, h, [10, 20, 50, 100, 200], colors='0.5', linewidths=0.5)
        plt.contour(x, y, sss, range(5, 36), cmap=self.cmap, vmin=5.0, vmax=35.0, linewidths=0.25, alpha=0.5)

        z = self.zw[self.n, 1:-1] - self.zw[self.n, 0]
        dz = np.diff(self.zr[self.n], axis=0)
        AKt = self.nc.variables['AKt'][self.n, 1:-1]

        temp = self.nc.variables['temp'][self.n, 0]
        salt = self.nc.variables['salt'][self.n, 0]

        o2_sat = octant.ocean.o2_sat(temp, salt)

        tflux = 0.5 * AKt * o2_sat / dz
        bflux = bottom_o2_flux(temp)

        T = z * o2_sat / (bflux - tflux) / 86400.0
        T = np.ma.masked_where(T<=0.0, T)
        To = z * o2_sat / (bflux) / 86400.0

        lon = self.ncg.variables['lon_psi'][:]
        lat = self.ncg.variables['lat_psi'][:]
        x, y = self.basemap(lon, lat)

        plot_type = 'bbl'
        if plot_type == 'timescale':
           plt.cm.Reds_r.set_under('0.90')
           self.pc = self.ax.pcolor(x, y, T[:, 1:-1, 1:-1].min(axis=0).filled(-999.0), vmin=0.0, vmax=90.0, cmap=plt.cm.Reds_r)
           self.cax = self.fig.add_axes([0.05, 0.92, 0.5, 0.03])
           cb = plt.colorbar(self.pc, cax=self.cax, 
                              orientation='horizontal')
           cb.set_label('Hypoxia timescale [days]')
        else:
           bbl = np.choose(T.argmin(axis=0), z)
           plt.cm.jet.set_under('0.90')
           bbl[ T.min(axis=0).filled(-999.0) < 0.0] = -999.0
           bbl[ T.min(axis=0) > 60.0] = -999.0
           self.pc = self.ax.pcolor(x, y, bbl[1:-1, 1:-1], vmin=0.0, vmax=5.0, cmap=plt.cm.jet)
           self.cax = self.fig.add_axes([0.05, 0.92, 0.5, 0.03])
           cb = plt.colorbar(self.pc, cax=self.cax, 
                              orientation='horizontal')
           cb.set_label('Bottom boundary layer thickness [m]')

        self.basemap.set_axes_limits(ax=self.ax)

    def plot_max_N2(self):

        h = self.ncg.variables['h'][:]
        lon = self.ncg.variables['lon_rho'][:]
        lat = self.ncg.variables['lat_rho'][:]
        x, y = self.basemap(lon, lat)

        mask = self.ncg.variables['mask_rho'][:]

        h = np.ma.masked_where(mask==0, h)
        plt.contour(x, y, h, [10, 20, 50, 100, 200], colors='0.5', linewidths=0.5)

        rho = self.nc.variables['rho'][self.n]
        zr = octant.roms.nc_depths(self.nc, grid='rho')[self.n]
        drdz = np.diff(rho, axis=0) / np.diff(zr, axis=0)
        prop = ( -9.8 * drdz / 1000.0 ).max(axis=0)
        prop = np.ma.masked_where(prop<=0, prop)
        self.pc = self.ax.pcolor(x, y, np.log10(prop), vmin=-5.0, vmax=-1.0, cmap=plt.cm.Reds)

        self.cax = self.fig.add_axes([0.05, 0.92, 0.5, 0.03])
        cb = plt.colorbar(self.pc, cax=self.cax, 
                          orientation='horizontal',
                          ticks=[-1.5, -2.5, -3.5, -4.5])
        cb.set_label(r'maximum log$_{10}(N^2)$')

        self.basemap.set_axes_limits(ax=self.ax)

    def plot_vector_surface(self):
        lon = self.ncg.variables['lon_psi'][:]
        lat = self.ncg.variables['lat_psi'][:]
        xv, yv = self.basemap(lon, lat)

        maskv = self.ncg.variables['mask_psi'][:]
        anglev = octant.tools.shrink(self.ncg.variables['angle'][:], xv.shape)

        u = self.nc.variables['u'][self.n][-1]
        v = self.nc.variables['v'][self.n][-1]
        u, v = octant.tools.shrink(u, v)
        u, v = octant.tools.rot2d(u, v, anglev)

        if self.frame == 0:
            idx, idy = np.where(maskv == 1.0)
            idv = np.arange(len(idx))
            np.random.shuffle(idv)
            Nvec = len(idx) / 15
            idv = idv[:Nvec]
            self.idx = idx[idv]
            self.idy = idy[idv]

        self.q = self.ax.quiver(xv[self.idx, self.idy],
                                yv[self.idx, self.idy],
                                u[self.idx, self.idy],
                                v[self.idx, self.idy],
                                scale=20.0, pivot='middle',
                                zorder=1e35, alpha=0.25,
                                width=0.003)

        self.ax.quiverkey(self.q, 0.8, 0.90,
                          0.5, r'0.5 m s$^{-1}$', zorder=1e35)

        self.basemap.set_axes_limits(ax=self.ax)

    def plot_vector_bottom(self):
        lon = self.ncg.variables['lon_psi'][:]
        lat = self.ncg.variables['lat_psi'][:]
        xv, yv = self.basemap(lon, lat)

        maskv = self.ncg.variables['mask_psi'][:]
        anglev = octant.tools.shrink(self.ncg.variables['angle'][:], xv.shape)

        u = self.nc.variables['u'][self.n, 1, :]
        v = self.nc.variables['v'][self.n, 1, :]
        u, v = octant.tools.shrink(u, v)
        u, v = octant.tools.rot2d(u, v, anglev)

        if self.frame == 0:
            idx, idy = np.where(maskv == 1.0)
            idv = np.arange(len(idx))
            np.random.shuffle(idv)
            Nvec = len(idx) / 15
            idv = idv[:Nvec]
            self.idx = idx[idv]
            self.idy = idy[idv]

        self.q = self.ax.quiver(xv[self.idx, self.idy],
                               yv[self.idx, self.idy],
                               u[self.idx, self.idy],
                               v[self.idx, self.idy],
                               scale=4.0, pivot='middle',
                               zorder=1e35, alpha=0.25,
                               width=0.003)

        self.ax.quiverkey(self.q, 0.8, 0.90, 
                            0.1, r'0.1 m s$^{-1}$', zorder=1e35)

        self.basemap.set_axes_limits(ax=self.ax)

    def plot_property_zslice(self, propname, zlevel, clabel, clim, cticks):
        '''plot 100 m currents over 500 m salinity'''

        self.zlevel = zlevel

        self.ax.set_axis_bgcolor('0.6')

        h = self.ncg.variables['h'][:]

        lon = self.ncg.variables['lon_rho'][:]
        lat = self.ncg.variables['lat_rho'][:]
        x, y = self.basemap(lon, lat)

        mask = self.ncg.variables['mask_rho'][:]

        z = octant.roms.nc_depths(self.nc)[self.n]

        h = np.ma.masked_where(mask==0, h)
        plt.contour(x, y, h, [50, 100, 200, 500, 1000, 2000], colors='0.5', linewidths=0.5)

        prop = self.nc.variables[propname][self.n, :]
        prop = octant.tools.surface(prop, z, self.zlevel)
        self.pc = self.ax.pcolor(x, y, prop, vmin=min(clim), vmax=max(clim))

        self.basemap.set_axes_limits(ax=self.ax)

        self.cax = self.fig.add_axes([0.5, 0.85, 0.3, 0.03])
        cb = plt.colorbar(self.pc, cax=self.cax, 
                          orientation='horizontal',
                          ticks=cticks)
        cb.set_label(clabel)

    def plot_attribution(self):
        self.ax.text(0.99, 0.0, 'Robert Hetland, TAMU\nMechanisms Controlling Hypoxia',
                    horizontalalignment='right',
                    verticalalignment='top',
                    transform = self.ax.transAxes, fontproperties=self.font_label)

    def plot_vector_zslice(self, zlevel=None):

        if zlevel is None:
            zlevel = self.zlevel

        lon = self.ncg.variables['lon_psi'][:]
        lat = self.ncg.variables['lat_psi'][:]
        xv, yv = self.basemap(lon, lat)

        maskv = self.ncg.variables['mask_psi'][:]
        anglev = octant.tools.shrink(self.ncg.variables['angle'][:], xv.shape)

        z = octant.roms.nc_depths(self.nc)[self.n]
        zv = octant.tools.shrink(z, (30,) + xv.shape)

        u = self.nc.variables['u'][self.n, :]
        v = self.nc.variables['v'][self.n, :]

        u = octant.tools.shrink(u, (30,) + xv.shape)
        v = octant.tools.shrink(v, (30,) + xv.shape)

        u = octant.tools.surface(u, zv, zlevel)
        v = octant.tools.surface(v, zv, zlevel)

        u, v = octant.tools.rot2d(u, v, anglev)

        if self.frame == 0:
            idx, idy = np.where(~np.isnan(u.copy()))
            idx = idx[~idx.mask].data
            idy = idy[~idy.mask].data
            idv = np.arange(len(idx))
            np.random.shuffle(idv)
            Nvec = len(idx) / 20
            idv = idv[:Nvec]
            self.idx = idx[idv]
            self.idy = idy[idv]

        self.q = self.ax.quiver(xv[self.idx, self.idy],
                               yv[self.idx, self.idy],
                               u[self.idx, self.idy],
                               v[self.idx, self.idy],
                               scale=3.0, pivot='middle', 
                               zorder=1e35)

        self.ax.quiverkey(self.q, 0.33, 0.48, 
                         0.1, '10 cm/s', zorder=1e35)

        self.basemap.set_axes_limits(ax=self.ax)

    def __del__(self):
        """docstring for __del__"""
        self.nc.close()
        self.ncg.close()


if __name__ == '__main__':

    #YEAR = int(sys.argv[1])
    YEAR = 2009
    url = 'http://comt.sura.org/thredds/dodsC/comt_1_archive_full/shelf_hypoxia/TAMU_ROMS/2004-2009_hycom_obc_24h/Output/mch_his_2009.nc'
    # grd_url = 'http://comt.sura.org/thredds/dodsC/comt_1_archive_full/shelf_hypoxia/TAMU_ROMS/common/mch_grd3m.nc'
    grd_url = PATH + '/mch_grd3m.nc'
    river_url = 'http://comt.sura.org/thredds/dodsC/comt_1_archive_full/shelf_hypoxia/TAMU_ROMS/common/river_frc.nc'
    wind_url = 'http://comt.sura.org/thredds/dodsC/comt_1_archive_full/shelf_hypoxia/TAMU_ROMS/common/wind_frc.nc'
    mch = mch_animation(YEAR,
                        [url],
                        'timescale_frames_full',
                        grdfile=grd_url)

    dates = np.load(PATH + '/mch_dates.npy')
    years = np.array([d.year for d in dates])
    year_idx = np.where(years == YEAR)[0]

    ncr = octant.io.Dataset(river_url)
    #river_time = octant.cf.time(ncr, name='river_time')
    river_dates = netCDF.num2date(ncr.variables['river_time'][:], 'seconds since 1970-01-01')
    Q = np.abs(ncr.variables['river_transport'][:]).sum(axis=1)*2.0/3.0
    river_years = np.array([d.year for d in river_dates])
    river_idx =np.where(river_years == YEAR)[0]

    ncw = octant.io.Dataset(wind_url)
    #wind_dates = octant.cf.time(ncw, name='wind_time').dates
    wind_dates = netCDF.num2date(ncw.variables['wind_time'][:], 'seconds since 1970-01-01')
    Uwind = ncw.variables['Uwind'][:]
    Vwind = ncw.variables['Vwind'][:]

    # tidx_start = np.where( dates == datetime(YEAR, 1, 1) )[0][0]
    # tidx_end = np.where( dates == datetime(YEAR+1, 1, 1) )[0][0]
    tidx_start = np.where( dates == datetime(YEAR, 5, 1) )[0][0]
    tidx_end = np.where( dates == datetime(YEAR, 6, 1) )[0][0]
    print 'running from {} to {}'.format(tidx_start, tidx_end)

    for tidx in range(tidx_start, tidx_end):
        print tidx
        mch.new_frame(tidx)
        # mch.plot_property_surface('salt',
        #                           r'SURFACE SALINITY [g kg$^{-1}$]',
        #                           clim=(5, 35),
        #                           cticks=np.arange(5.0, 40.0, 5.0))
        # mch.plot_property_surface('rho',
        #                           r'SURFACE DENSITY [kg m$^{-3}$]',
        #                           clim=(5, 25),
        #                           cticks=np.arange(5.0, 30.0, 5.0))
        # mch.plot_property_bottom('rho',
        #                           r'BOTTOM DENSITY [kg m$^{-3}$]',
        #                           clim=(5, 25),
        #                           cticks=np.arange(5.0, 30.0, 5.0))
        # mch.plot_max_N2()
        mch.plot_hypoxia_timescales()
        #mch.filled_timeseries(river_dates[river_idx], Q[river_idx])
        #mch.add_wind_arrow(wind_dates, Uwind, Vwind)
        mch.plot_vector_surface()
        # mch.plot_vector_bottom()
        mch.plot_attribution()
        mch.close_frame()
