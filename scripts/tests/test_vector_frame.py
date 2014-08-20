#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import glob
import subprocess

import numpy as np

import vector_frame


np.random.seed(0xDEADBEEF)
vector_frame.NFRAMES = 1

TEST_FILES = glob.glob('json_data/step*.json')
TEST_FILES.append('json_data/grd_locations.json')


def remove_old():
    for f in TEST_FILES:
        if os.path.isfile(f):
            os.unlink(f)


def diff_file(f):
    d, fname = os.path.split(f)
    f_ref = os.path.join(d, 'ref_' + fname)
    try:
        subprocess.check_call(['diff', f, f_ref])
    except:
        raise AssertionError("Files differ: {!r} {!r}".format(f, f_ref))


def test_files():
    try:
        vector_frame.main()
        for f in TEST_FILES:
            yield diff_file, f
    finally:
        remove_old()
