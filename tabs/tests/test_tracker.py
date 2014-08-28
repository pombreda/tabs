import json
from unittest import TestCase

import numpy as np

from ..tracker import run_tracpy, tracks_to_geojson


class TestTracker(TestCase):

    def test_tracks_to_geojson(self):
        lonp = np.ones((4, 4))
        latp = lonp.copy()
        geojson = tracks_to_geojson(lonp, latp)
        mapping = json.loads(geojson)
        self.assertIn('coordinates', mapping)
        self.assertEqual(mapping['type'], 'MultiLineString')

    def test_run_tracpy(self):
        # FIXME: segfault is bad
        lonp, latp = run_tracpy(ndays=1)
        self.assertInstance(lonp, np.array)
        self.assertInstance(latp, np.array)
