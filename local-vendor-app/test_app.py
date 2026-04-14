"""Module for testing LocalSphere vendor app."""
import unittest
import os


class TestLocalVendorApp(unittest.TestCase):
    """Unit tests for local-vendor-app."""

    def test_package_json_exists(self):
        """Verify package.json exists."""
        self.assertTrue(os.path.exists('package.json'))

    def test_src_folder_exists(self):
        """Verify src folder exists."""
        self.assertTrue(os.path.exists('src'))

    def test_db_config_exists(self):
        """Verify db config exists."""
        self.assertTrue(os.path.exists('src/config/db.js'))

    def test_auth_controller_exists(self):
        """Verify authController exists."""
        self.assertTrue(os.path.exists('src/controllers/authController.js'))

    def test_order_controller_exists(self):
        """Verify orderController exists."""
        self.assertTrue(os.path.exists('src/controllers/orderController.js'))


if __name__ == '__main__':
    unittest.main()