"""
Unit tests for Dolphin DO-107 GPS Protocol Decoder & Integration
Includes official reference vectors from docs.mydolphin.org
"""
import asyncio
import os
import struct
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

# Add app to sys.path
_app_dir = Path(__file__).resolve().parent.parent / "app"
if str(_app_dir) not in sys.path:
    sys.path.insert(0, str(_app_dir))

# Import database before schemas/models to avoid circular import
from core.database import get_db, init_database
from models.schemas import NormalizedPosition
from protocols import ProtocolRegistry
from protocols.dolphin import DolphinDecoder
from protocols.dolphin_proto import Messages_pb2, Config_pb2

try:
    import lz4.block
except ImportError:
    lz4 = None


class TestDolphinProtocol(unittest.TestCase):
    def setUp(self):
        self.decoder = DolphinDecoder()

    def test_protocol_registration(self):
        """Assert Dolphin decoder is properly registered in ProtocolRegistry on port 5050."""
        self.assertIn("dolphin", ProtocolRegistry.list_protocols())
        reg_decoder = ProtocolRegistry.get_decoder("dolphin")
        self.assertIsInstance(reg_decoder, DolphinDecoder)
        self.assertEqual(reg_decoder.PORT, 5050)
        self.assertEqual(reg_decoder.PROTOCOL_TYPES, ['tcp'])

    def test_official_example2_device_packet_decode(self):
        """
        Official Device Packet Test Vector (Example 2):
        Raw Hex:
          ababe0380000000100000100292f0b86c70e03003b000000000000000a390dad04ff4115ae7559421d00909a4435cd8c2f43452976b45c48015a0b0a0b1e3233343536374664620f000000f4c70200ab5d00bc2400006d
        """
        raw_hex = (
            "ababe0380000000100000100292f0b86c70e03003b00000000000000"
            "0a390dad04ff4115ae7559421d00909a4435cd8c2f43452976b45c48"
            "015a0b0a0b1e3233343536374664620f000000f4c70200ab5d00bc24"
            "00006d"
        )
        packet_bytes = bytes.fromhex(raw_hex)
        self.assertEqual(len(packet_bytes), 87)

        # 1. Header assertions
        head = packet_bytes[0:2]
        tid = struct.unpack('<I', packet_bytes[2:6])[0]
        api_ver = struct.unpack('>H', packet_bytes[6:8])[0]
        flag = struct.unpack('>H', packet_bytes[8:10])[0]
        msg_type = struct.unpack('<H', packet_bytes[10:12])[0]
        imei = struct.unpack('<Q', packet_bytes[12:20])[0]
        data_len = struct.unpack('<I', packet_bytes[20:24])[0]
        reserved = struct.unpack('<I', packet_bytes[24:28])[0]

        self.assertEqual(head, b'\xab\xab')
        self.assertEqual(tid, 14560)
        self.assertEqual(api_ver, 1)
        self.assertEqual(flag, 0)
        self.assertEqual(msg_type, 1)  # DataPack_Request
        self.assertEqual(imei, 860675040292649)
        self.assertEqual(data_len, 59)
        self.assertEqual(reserved, 0)

        # 2. Async decode assertion
        result, consumed = asyncio.run(self.decoder.decode(packet_bytes, {"ip": "127.0.0.1", "port": 5050}))

        self.assertEqual(consumed, 87)
        self.assertIsInstance(result, dict)
        self.assertEqual(result["imei"], "860675040292649")

        # 3. Position and Telemetry assertions
        pos = result.get("position")
        self.assertIsNotNone(pos)
        self.assertIsInstance(pos, NormalizedPosition)
        self.assertEqual(pos.imei, "860675040292649")
        self.assertEqual(pos.protocol, "dolphin")
        self.assertAlmostEqual(pos.latitude, 31.877283, places=4)
        self.assertAlmostEqual(pos.longitude, 54.364921, places=4)
        self.assertAlmostEqual(pos.altitude, 1236.5, places=1)
        self.assertAlmostEqual(pos.course, 175.55, places=1)
        self.assertEqual(pos.device_time, datetime.fromtimestamp(1555330601, tz=timezone.utc))

        # Sensor & I/O assertions
        self.assertFalse(pos.ignition)
        self.assertFalse(pos.sensors.get("movement"))
        self.assertFalse(pos.sensors.get("motion"))
        self.assertEqual(pos.sensors.get("total_odometer"), 41972)
        self.assertEqual(pos.sensors.get("engine_on_time"), 11947)
        self.assertEqual(pos.sensors.get("idling_time"), 4668)
        self.assertEqual(pos.sensors.get("analog_input1"), 109)

        # 4. Response ACK assertion (Must echo TID = 14560 = 0xe0380000 with DataPack_Response)
        response_bytes = result.get("response")
        self.assertIsNotNone(response_bytes)
        expected_response_hex = "ababe03800000000020002000000000000000801"
        self.assertEqual(response_bytes.hex(), expected_response_hex)

    def test_official_example3_server_response_packet_format(self):
        """
        Official Server Packet Test Vector (Example 3):
        For TID = 1760 (0xe0060000), Flag = 0, Message Type = 2 (DataPack_Response),
        and payload 0x0801 (DataLength = 2), server packet must produce:
          ababe00600000000020002000000000000000801
        """
        tid = 1760
        msg_type = 2
        payload = bytes.fromhex("0801")
        built_packet = self.decoder._build_server_packet(tid, msg_type, payload)
        expected_hex = "ababe00600000000020002000000000000000801"
        self.assertEqual(built_packet.hex(), expected_hex)
        self.assertEqual(len(built_packet), 20)

    def test_stream_fragmentation_and_buffering(self):
        """Verify decoder properly handles fragmented TCP byte streams."""
        raw_hex = (
            "ababe0380000000100000100292f0b86c70e03003b00000000000000"
            "0a390dad04ff4115ae7559421d00909a4435cd8c2f43452976b45c48"
            "015a0b0a0b1e3233343536374664620f000000f4c70200ab5d00bc24"
            "00006d"
        )
        data = bytes.fromhex(raw_hex)

        # Under 28 bytes header -> returns None, 0
        res1, consumed1 = asyncio.run(self.decoder.decode(data[:15], {"ip": "127.0.0.1", "port": 5050}))
        self.assertIsNone(res1)
        self.assertEqual(consumed1, 0)

        # Header only (28 bytes) but no payload -> returns None, 0
        res2, consumed2 = asyncio.run(self.decoder.decode(data[:28], {"ip": "127.0.0.1", "port": 5050}))
        self.assertIsNone(res2)
        self.assertEqual(consumed2, 0)

        # Complete packet -> returns result, consumed 87
        res3, consumed3 = asyncio.run(self.decoder.decode(data, {"ip": "127.0.0.1", "port": 5050}))
        self.assertIsNotNone(res3)
        self.assertEqual(consumed3, 87)

        # Packet with trailing bytes from next packet
        trailing = b"\xab\xab\x12\x34"
        res4, consumed4 = asyncio.run(self.decoder.decode(data + trailing, {"ip": "127.0.0.1", "port": 5050}))
        self.assertIsNotNone(res4)
        self.assertEqual(consumed4, 87)

        # Noise preceding header -> discards noise
        noise = b"\x00\x11\x22\x33"
        res5, consumed5 = asyncio.run(self.decoder.decode(noise + data, {"ip": "127.0.0.1", "port": 5050}))
        self.assertIsNone(res5)
        self.assertEqual(consumed5, len(noise))

    def test_lz4_compression_handling(self):
        """Verify decoder decompresses payloads when Flag Bit 0 is 1."""
        if not lz4:
            self.skipTest("lz4 not installed")

        req = Messages_pb2.DataPackRequest()
        pt = req.Points.add()
        pt.Latitude = 35.6892
        pt.Longitude = 51.3890
        pt.Altitude = 1180.0
        pt.Speed = 45.0
        pt.Bearing = 90.0
        pt.Timestamp = 1600000000
        pt.IOList_ID.append(Config_pb2.Alarm_Ignition)
        pt.IOList_Value.append(1)

        uncompressed = req.SerializeToString()
        compressed = lz4.block.compress(uncompressed, store_size=True)

        tid = 9999
        flag = 0x0001  # Bit 0 set = compressed
        msg_type = 1
        imei = 860675040292000

        header = (
            b'\xab\xab' +
            struct.pack('<I', tid) +
            struct.pack('>H', 1) +
            struct.pack('>H', flag) +
            struct.pack('<H', msg_type) +
            struct.pack('<Q', imei) +
            struct.pack('<I', len(compressed)) +
            struct.pack('<I', 0)
        )
        packet = header + compressed

        result, consumed = asyncio.run(self.decoder.decode(packet, {"ip": "127.0.0.1", "port": 5050}))
        self.assertIsNotNone(result)
        self.assertEqual(consumed, len(packet))
        self.assertTrue(result["position"].ignition)
        self.assertAlmostEqual(result["position"].latitude, 35.6892, places=4)
        self.assertAlmostEqual(result["position"].longitude, 51.3890, places=4)

    def test_authentication_request(self):
        """Verify Authentication_Request sends back valid Authentication_Response."""
        auth_req = Messages_pb2.AuthenticateRequest(Code="DOLPHIN123")
        payload = auth_req.SerializeToString()
        tid = 500
        header = (
            b'\xab\xab' +
            struct.pack('<I', tid) +
            struct.pack('>H', 1) +
            struct.pack('>H', 0) +
            struct.pack('<H', 7) +  # Authentication_Request = 7
            struct.pack('<Q', 860675040292649) +
            struct.pack('<I', len(payload)) +
            struct.pack('<I', 0)
        )
        packet = header + payload

        result, consumed = asyncio.run(self.decoder.decode(packet, {"ip": "127.0.0.1", "port": 5050}))
        self.assertIsNotNone(result)
        self.assertEqual(result["event"], "login")
        self.assertEqual(result["imei"], "860675040292649")

        # Response packet must be Authentication_Response (type 8)
        resp = result["response"]
        self.assertEqual(resp[0:2], b'\xab\xab')
        resp_tid = struct.unpack('<I', resp[2:6])[0]
        self.assertEqual(resp_tid, tid)
        resp_type = struct.unpack('<H', resp[8:10])[0]
        self.assertEqual(resp_type, 8)

    def test_ping_pong_keepalive(self):
        """Verify Ping produces Pong response with matching TID."""
        tid = 777
        header = (
            b'\xab\xab' +
            struct.pack('<I', tid) +
            struct.pack('>H', 1) +
            struct.pack('>H', 0) +
            struct.pack('<H', 30) +  # Ping = 30
            struct.pack('<Q', 860675040292649) +
            struct.pack('<I', 0) +
            struct.pack('<I', 0)
        )
        result, consumed = asyncio.run(self.decoder.decode(header, {"ip": "127.0.0.1", "port": 5050}))
        self.assertIsNotNone(result)
        resp = result["response"]
        resp_tid = struct.unpack('<I', resp[2:6])[0]
        resp_type = struct.unpack('<H', resp[8:10])[0]
        self.assertEqual(resp_tid, tid)
        self.assertEqual(resp_type, 31)  # Pong = 31

    def test_command_response(self):
        """Verify Command_Response returns command_ack event."""
        cmd_resp = Messages_pb2.CommandResponse(Response="OK:REBOOTING")
        payload = cmd_resp.SerializeToString()
        tid = 888
        header = (
            b'\xab\xab' +
            struct.pack('<I', tid) +
            struct.pack('>H', 1) +
            struct.pack('>H', 0) +
            struct.pack('<H', 61) +  # Command_Response = 61
            struct.pack('<Q', 860675040292649) +
            struct.pack('<I', len(payload)) +
            struct.pack('<I', 0)
        )
        result, consumed = asyncio.run(self.decoder.decode(header + payload, {"ip": "127.0.0.1", "port": 5050}))
        self.assertIsNotNone(result)
        self.assertEqual(result["event"], "command_ack")
        self.assertEqual(result["response_text"], "OK:REBOOTING")

    def test_command_encoding(self):
        """Verify encode_command generates valid Command_Request packet."""
        # Built-in command
        cmd_bytes = asyncio.run(self.decoder.encode_command("reboot", {}))
        self.assertEqual(cmd_bytes[0:2], b'\xab\xab')
        msg_type = struct.unpack('<H', cmd_bytes[8:10])[0]
        self.assertEqual(msg_type, 60)  # Command_Request = 60
        data_len = struct.unpack('<I', cmd_bytes[10:14])[0]
        payload = cmd_bytes[18:18 + data_len]
        cmd_req = Messages_pb2.CommandRequest()
        cmd_req.ParseFromString(payload)
        self.assertEqual(cmd_req.Command, "RESET")

        # Custom command
        custom_bytes = asyncio.run(self.decoder.encode_command("custom", {"payload": "SET APN internet"}))
        data_len2 = struct.unpack('<I', custom_bytes[10:14])[0]
        payload2 = custom_bytes[18:18 + data_len2]
        cmd_req2 = Messages_pb2.CommandRequest()
        cmd_req2.ParseFromString(payload2)
        self.assertEqual(cmd_req2.Command, "SET APN internet")


if __name__ == "__main__":
    unittest.main()
