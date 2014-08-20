#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import glob
import subprocess

import numpy as np

import vector_frame


TEST_FILES = [f.replace('ref_', '') for f in glob.glob('json_data/*.json')]

np.random.seed(0xDEADBEEF)
vector_frame.NFRAMES = len([f for f in TEST_FILES if 'step' in f])


def remove_old():
    for f in TEST_FILES:
        if os.path.isfile(f):
            os.unlink(f)


def diff_file(f):
    d, fname = os.path.split(f)
    f_ref = os.path.join(d, 'ref_' + fname)
    try:
        subprocess.check_call(['diff', f_ref, f])
    except:
        raise AssertionError("Files differ: {!r} {!r}".format(f, f_ref))


def test_files():
    try:
        vector_frame.main()
        for f in TEST_FILES:
            yield diff_file, f
    finally:
        remove_old()
