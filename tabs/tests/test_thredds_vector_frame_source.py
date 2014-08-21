#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import glob
import subprocess

import numpy as np

from ..thredds_vector_frame_source import main


TEST_FILES = sorted([f.replace('ref_', '')
                     for f in glob.glob('json_data/ref_*.json')])

np.random.seed(0xDEADBEEF)
NFRAMES = len([f for f in TEST_FILES if 'step' in f])


def remove_old():
    for f in TEST_FILES:
        if os.path.isfile(f):
            os.unlink(f)


def diff_file(f):
    if not os.path.isfile(f):
        return
    d, fname = os.path.split(f)
    f_ref = os.path.join(d, 'ref_' + fname)
    try:
        subprocess.check_output(['diff', '-u', f_ref, f])
    except:
        raise AssertionError("Files differ: {!r} {!r}".format(f, f_ref))


def test_files():
    try:
        main(NFRAMES)
        for f in TEST_FILES:
            yield diff_file, f
    finally:
        remove_old()
