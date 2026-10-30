import unittest
import json
import os
from py2max import MaxJSONEncoder


class TestMaxJSONEncoder(unittest.TestCase):
    """Test MaxJSONEncoder to ensure it produces exact Max/MSP formatting."""

    def setUp(self):
        """Set up test fixtures."""
        self.encoder = MaxJSONEncoder()
        self.test_dir = os.path.dirname(os.path.abspath(__file__))
        self.example_file = os.path.join(self.test_dir, "example.amxd.json")

    def test_roundtrip_exact_match(self):
        """Test that loading and re-encoding example.json produces identical output."""
        # Load the original JSON file as a string
        with open(self.example_file, 'rb') as f:
            original_bytes = f.read()

        # Parse the JSON to a Python object
        parsed_obj = json.loads(original_bytes.decode('utf-8'))

        # Encode back to string using MaxJSONEncoder
        encoded_bytes = self.encoder.encode(parsed_obj).encode('utf-8')

        # Compare: they must be EXACTLY the same
        self.assertEqual(
            original_bytes,
            encoded_bytes,
            msg="Encoded JSON does not match original exactly"
        )

    def test_roundtrip_byte_by_byte(self):
        """Test byte-by-byte comparison to ensure no encoding issues."""
        # Load the original JSON file as bytes
        with open(self.example_file, 'rb') as f:
            original_bytes = f.read()

        # Decode to string, parse, encode, and convert back to bytes
        original_string = original_bytes.decode('utf-8')
        parsed_obj = json.loads(original_string)
        encoded_string = self.encoder.encode(parsed_obj)
        encoded_bytes = encoded_string.encode('utf-8')

        # Compare byte-by-byte
        self.assertEqual(
            original_bytes,
            encoded_bytes,
            msg="Encoded bytes do not match original exactly"
        )

        # Also check length
        self.assertEqual(
            len(original_bytes),
            len(encoded_bytes),
            msg=f"Length mismatch: original={len(original_bytes)}, encoded={len(encoded_bytes)}"
        )


    def test_line_endings_preserved(self):
        """Test that CRLF line endings are preserved."""
        with open(self.example_file, 'rb') as f:
            original_bytes = f.read()

        parsed_obj = json.loads(original_bytes.decode('utf-8'))
        encoded_bytes = self.encoder.encode(parsed_obj).encode('utf-8')

        # Check that CRLF is used
        self.assertIn(b'\r\n', encoded_bytes, msg="Output should contain CRLF line endings")

        # Count line endings - should only have CRLF, not standalone LF
        crlf_count = encoded_bytes.count(b'\r\n')
        lf_count = encoded_bytes.count(b'\n')
        self.assertEqual(crlf_count, lf_count, msg="All LF should be part of CRLF pairs")


if __name__ == '__main__':
    unittest.main()

