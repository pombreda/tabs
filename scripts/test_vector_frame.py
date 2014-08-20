#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import subprocess

import numpy as np
np.random.seed(0xDEADBEEF)

import vector_frame


def diff_file(f):
    f1 = os.path.join('json_data', 'ref_' + f)
    f2 = os.path.join('json_data', f)
    try:
        subprocess.check_call(['diff', f1, f2])
    except:
        raise AssertionError("Files differ: {!r} {!r}".format(f1, f2))


def test_files():
    vector_frame.main()
    for f in ['step0.json', 'grd_locations.json']:
        yield diff_file, f
