"""
Unit tests for Teltonika Protocol Decoder & Gateway Ingestion
"""
import asyncio
import struct
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

# Add app to sys.path
_app_dir = Path(__file__).resolve().parent.parent / "app"
if str(_app_dir) not in sys.path:
    sys.path.insert(0, str(_app_dir))

from core.database import get_db, init_database
from models.schemas import NormalizedPosition
from protocols import ProtocolRegistry
from protocols.teltonika import TeltonikaDecoder


class TestTeltonikaProtocol(unittest.TestCase):
    def setUp(self):
        self.decoder = TeltonikaDecoder()

    def test_protocol_registration(self):
        self.assertIn("teltonika", ProtocolRegistry.list_protocols())
        reg_decoder = ProtocolRegistry.get_decoder("teltonika")
        self.assertIsInstance(reg_decoder, TeltonikaDecoder)
        self.assertEqual(reg_decoder.PORT, 5027)
        self.assertEqual(reg_decoder.PROTOCOL_TYPES, ['tcp', 'udp'])

    def test_tls_probe_rejection(self):
        """Verify TLS ClientHello probes are completely discarded and not treated as login."""
        tls_payload = (
            b'\x16\x03\x01\x00\x50' +
            b'\x01' * 20 +
            b'\x00\x0a\x00\x08\x00\x06\x00\x1d\x00\x17\x00\x18' +
            b'\x00' * 30
        )
        res, consumed = asyncio.run(self.decoder.decode(tls_payload, {"ip": "37.129.205.214"}))
        self.assertIsNone(res)
        self.assertEqual(consumed, len(tls_payload))

    def test_http_probe_rejection(self):
        """Verify HTTP/WebSocket probes on GPS port are safely discarded."""
        http_payload = b"GET /download HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n"
        res, consumed = asyncio.run(self.decoder.decode(http_payload, {"ip": "172.25.0.1"}))
        self.assertIsNone(res)
        self.assertEqual(consumed, len(http_payload))

    def test_corrupt_null_byte_imei_rejected(self):
        """
        Verify the exact malicious / corrupted byte sequence from the bug:
        Length 10 followed by: \x00\x08\x00\x06\x00\x1d\x00\x17\x00\x18
        is NOT parsed as an IMEI login.
        """
        bad_bytes = b'\x00\x0a\x00\x08\x00\x06\x00\x1d\x00\x17\x00\x18'
        res, consumed = asyncio.run(self.decoder.decode(bad_bytes, {"ip": "37.129.205.214"}))
        self.assertIsNone(res)
        self.assertEqual(consumed, 1)

    def test_fragmented_tcp_preamble_waits_for_data(self):
        """Verify that a partial TCP preamble (4 bytes of 0x00000000) does not get discarded."""
        frag = b'\x00\x00\x00\x00'
        res, consumed = asyncio.run(self.decoder.decode(frag, {"ip": "127.0.0.1"}))
        self.assertIsNone(res)
        self.assertEqual(consumed, 0)

        # 1, 2, or 3 zeros should also wait
        for i in range(1, 4):
            res, consumed = asyncio.run(self.decoder.decode(b'\x00' * i, {"ip": "127.0.0.1"}))
            self.assertIsNone(res)
            self.assertEqual(consumed, 0)

    def test_valid_tcp_imei_login(self):
        """Verify valid 15-digit ASCII IMEI login succeeds with 0x01 ACK."""
        imei = "860675040292649"
        packet = struct.pack('>H', len(imei)) + imei.encode('ascii')
        res, consumed = asyncio.run(self.decoder.decode(packet, {"ip": "127.0.0.1"}))
        self.assertIsNotNone(res)
        self.assertEqual(res.get("event"), "login")
        self.assertEqual(res.get("imei"), imei)
        self.assertEqual(res.get("response"), b'\x01')
        self.assertEqual(consumed, len(packet))

    def test_database_get_device_by_imei_handles_null_bytes_safely(self):
        """Verify get_device_by_imei returns None without executing invalid SQL when string has null bytes."""
        from core.database import DatabaseService
        db = DatabaseService.__new__(DatabaseService)
        res = asyncio.run(db.get_device_by_imei("\x00\x08\x00\x06\x00\x1d\x00\x17\x00\x18"))
        self.assertIsNone(res)

        res_empty = asyncio.run(db.get_device_by_imei(""))
        self.assertIsNone(res_empty)

        res_none = asyncio.run(db.get_device_by_imei(None))
        self.assertIsNone(res_none)


if __name__ == "__main__":
    unittest.main()
