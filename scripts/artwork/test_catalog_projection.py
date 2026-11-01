"""Numerical checks for catalogue projection. Run in dl_env."""
import unittest
import numpy as np
from catalog_projection import *
class ProjectionTests(unittest.TestCase):
 def test_anchor(self):
  np.testing.assert_allclose(project(17.760333,-28.936175),[1080,735],atol=1e-8)
  np.testing.assert_allclose(project(20.690532,45.280338),[520,230],atol=1e-8)
 def test_round_trip(self):
  # Independent inverse of stereographic projection recovers the catalogue sphere.
  for row in CATALOG[::17]:
   v=unit(float(row['ra']),float(row['dec']))
   if np.dot(v,CENTER)<-.8:continue
   xy=(ROT.T@(project(row['ra'],row['dec'])-[1080,735]))/SCALE+raw(GC)
   q=np.dot(xy,xy)/4
   recovered=((1-q)*CENTER-xy[0]*EAST-xy[1]*NORTH)/(1+q)
   np.testing.assert_allclose(recovered,v,atol=1e-10)
 def test_no_reflection_and_named_identity(self):
  self.assertAlmostEqual(np.linalg.det(ROT),1)
  for name,hip in NAMED.items():self.assertIn(str(hip),BY_HIP)
  self.assertEqual(BY_HIP[str(NAMED['vega'])]['proper'],'Vega')
  self.assertEqual(BY_HIP[str(NAMED['antares'])]['proper'],'Antares')
if __name__=='__main__':unittest.main()
