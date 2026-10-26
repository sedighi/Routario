"""
Dolphin DO-107 GPS Protocol Decoder & Transport Handler
Supports native TCP connections on port 5050 (configurable via DOLPHIN_PORT)
Protocol Buffer v3 wire format with optional LZ4 compression.
"""
import logging
import os
import struct
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    import lz4.block
except ImportError:
    lz4 = None

from models.schemas import NormalizedPosition
from . import BaseProtocolDecoder, ProtocolRegistry
from .dolphin_proto import Messages_pb2, Config_pb2

logger = logging.getLogger(__name__)


@ProtocolRegistry.register("dolphin")
class DolphinDecoder(BaseProtocolDecoder):
    """
    Decoder and command encoder for the Dolphin DO-107 GPS Tracker.
    Specification: https://docs.mydolphin.org/
    Default Port: 5050 (TCP)
    """

    PORT: int = int(os.getenv("DOLPHIN_PORT", 5050))
    PROTOCOL_TYPES: list = ['tcp']

    # 0xABAB Magic Header
    HEADER_MAGIC: bytes = b'\xab\xab'
    DEVICE_HEADER_SIZE: int = 28
    SERVER_HEADER_SIZE: int = 18

    # Command sequence counter for outbound commands
    _cmd_counter: int = 1

    COMMAND_REGISTRY = {
        'custom': {
            'description': 'Send custom ASCII or hex command to Dolphin DO-107',
            'example': 'STATUS',
            'requires_params': True,
        },
        'status': {
            'description': 'Query tracker status',
            'example': 'STATUS',
            'requires_params': False,
            'cmd': 'STATUS',
        },
        'reboot': {
            'description': 'Reboot device',
            'example': 'RESET',
            'requires_params': False,
            'cmd': 'RESET',
        },
        'version': {
            'description': 'Query firmware and hardware version',
            'example': 'VER',
            'requires_params': False,
            'cmd': 'VER',
        },
        'get_gps': {
            'description': 'Request current GPS location',
            'example': 'GPS',
            'requires_params': False,
            'cmd': 'GPS',
        },
    }

    NATIVE_EVENTS = [
        {"key": "alarm",            "label": "🔔 Alarm",              "severity": "critical", "trigger_value": "1"},
        {"key": "towing",           "label": "🚗 Towing",             "severity": "critical", "trigger_value": "1"},
        {"key": "gnss_jamming",     "label": "📵 GPS Jamming",         "severity": "warning",  "trigger_value": "1"},
        {"key": "gsm_jamming",      "label": "📶 GSM Jamming",         "severity": "warning",  "trigger_value": "1"},
        {"key": "crash_detection",  "label": "💥 Crash Detected",      "severity": "critical", "trigger_value": "1"},
        {"key": "movement",         "label": "📍 Movement",           "severity": "info",     "trigger_value": "1"},
        {"key": "ignition",         "label": "🔑 Ignition On",        "severity": "info",     "trigger_value": "1"},
        {"key": "power_cut",        "label": "🔌 External Power Lost", "severity": "critical", "trigger_value": "1"},
        {"key": "sleep_mode",       "label": "💤 Sleep Mode Change",   "severity": "info",     "trigger_value": "1"},
    ]

    SLEEP_MODES = {
        0: "NoSleep",
        1: "GPSSleep",
        2: "DeepSleep",
        3: "OnlineSleep",
        4: "UltraSleep",
    }

    IO_MAPPINGS: Dict[int, Tuple[str, float, Optional[str]]] = {
        # id: (sensor_name, multiplier, type_cast)
        3:   ("uptime", 1.0, "int"),
        4:   ("heading", 1.0, "float"),
        5:   ("speed", 1.0, "float"),
        8:   ("sleep_mode", 1.0, "sleep"),
        10:  ("ignition", 1.0, "bool"),
        11:  ("movement", 1.0, "bool"),
        12:  ("data_mode", 1.0, "int"),
        20:  ("gnss_status", 1.0, "int"),
        21:  ("hdop", 0.1, "float"),
        22:  ("pdop", 0.1, "float"),
        23:  ("gnss_jamming", 1.0, "int"),
        24:  ("gnss_data_jumping", 1.0, "int"),
        30:  ("gsm_signal", 1.0, "int"),
        31:  ("cell_id", 1.0, "int"),
        32:  ("lac", 1.0, "int"),
        33:  ("operator", 1.0, "str"),
        34:  ("modem_temp", 1.0, "float"),
        35:  ("gsm_jamming", 1.0, "int"),
        40:  ("external_voltage", 0.001, "float"),  # mV -> Volts
        41:  ("battery_voltage", 0.001, "float"),   # mV -> Volts
        42:  ("battery_current", 1.0, "float"),
        50:  ("total_odometer", 1.0, "int"),
        51:  ("odometer", 1.0, "int"),
        52:  ("engine_on_time", 1.0, "int"),
        53:  ("engine_on_time_delta", 1.0, "int"),
        54:  ("idling_time", 1.0, "int"),
        55:  ("idling_time_delta", 1.0, "int"),
        60:  ("speed_sensor_speed", 1.0, "float"),
        61:  ("speed_sensor_distance", 1.0, "float"),
        62:  ("speed_sensor_total_distance", 1.0, "float"),
        70:  ("din1", 1.0, "bool"),
        71:  ("din2", 1.0, "bool"),
        72:  ("power_supply", 1.0, "bool"),
        73:  ("din3", 1.0, "bool"),
        80:  ("din1_time", 1.0, "int"),
        82:  ("din2_time", 1.0, "int"),
        84:  ("power_supply_time", 1.0, "int"),
        86:  ("din3_time", 1.0, "int"),
        90:  ("dout1", 1.0, "bool"),
        91:  ("dout2", 1.0, "bool"),
        100: ("analog_input1", 1.0, "float"),
        101: ("analog_input2", 1.0, "float"),
        102: ("analog_input3", 1.0, "float"),
        110: ("axis_x", 1.0, "int"),
        111: ("axis_y", 1.0, "int"),
        112: ("axis_z", 1.0, "int"),
        150: ("eco_max_speed", 1.0, "float"),
        170: ("eco_idling_event", 1.0, "int"),
        180: ("eco_break_counter", 1.0, "int"),
        181: ("eco_harsh_break_counter", 1.0, "int"),
        183: ("eco_harsh_accel_counter", 1.0, "int"),
        184: ("eco_cornering_counter", 1.0, "int"),
        300: ("trip", 1.0, "int"),
        301: ("trip_time", 1.0, "int"),
        302: ("trip_distance", 1.0, "float"),
        330: ("service", 1.0, "int"),
        340: ("crash_detection", 1.0, "int"),
        350: ("driver_id", 1.0, "str"),
        400: ("temp1", 0.1, "float"),
        402: ("temp2", 0.1, "float"),
        404: ("temp3", 0.1, "float"),
        410: ("humidity", 1.0, "float"),
        490: ("tilt_status", 1.0, "int"),
        500: ("rpm", 1.0, "int"),
        501: ("obd_battery_voltage", 0.001, "float"),
        502: ("coolant_temp", 1.0, "float"),
        503: ("obd_speed", 1.0, "float"),
        504: ("obd_distance", 1.0, "float"),
        505: ("fuel_rate", 1.0, "float"),
        506: ("fuel_used", 1.0, "float"),
        507: ("intake_air_temp", 1.0, "float"),
        508: ("manifold_pressure", 1.0, "float"),
        550: ("obd_mil", 1.0, "bool"),
        551: ("dtc_count", 1.0, "int"),
        552: ("engine_load", 1.0, "float"),
        553: ("maf_rate", 1.0, "float"),
        554: ("throttle_pos", 1.0, "float"),
        556: ("fuel_level", 1.0, "float"),
        560: ("engine_oil_temp", 1.0, "float"),
        715: ("can_rpm", 1.0, "int"),
        716: ("can_engine_hours", 1.0, "float"),
        717: ("can_distance", 1.0, "float"),
        718: ("can_fuel_used", 1.0, "float"),
        719: ("can_fuel_level", 1.0, "float"),
    }

    # ================================================================== #
    #  Transport & Framing Parser                                         #
    # ================================================================== #

    async def decode(
        self,
        data: bytes,
        client_info: Dict[str, Any],
        known_imei: Optional[str] = None,
    ) -> Tuple[Union[NormalizedPosition, Dict[str, Any], None], int]:
        """
        Decode raw incoming stream bytes from Dolphin DO-107 tracker.
        Returns: (Result, ConsumedBytes)
        """
        try:
            if not data:
                return None, 0

            # 1. Search for 0xABAB magic header
            magic_idx = data.find(self.HEADER_MAGIC)
            if magic_idx < 0:
                # Magic header not found: discard data except last byte if it is 0xAB
                if data.endswith(b'\xab'):
                    return None, len(data) - 1
                return None, len(data)
            elif magic_idx > 0:
                # Discard noise bytes preceding 0xABAB
                return None, magic_idx

            # 2. Check if full 28-byte header has arrived
            if len(data) < self.DEVICE_HEADER_SIZE:
                return None, 0

            # 3. Unpack 28-byte device-to-server header
            # Offset 0:  Uint16 (2)              - Magic 0xABAB
            # Offset 2:  Uint32 LE (<I) (4)      - TID
            # Offset 6:  Uint16 BE (>H) (2)      - API Version
            # Offset 8:  Uint16 BE (>H) (2)      - Flag (Bit 0 = LZ4 compressed)
            # Offset 10: Uint16 LE (<H) (2)      - Message Type
            # Offset 12: Uint64 LE (<Q) (8)      - IMEI
            # Offset 20: Uint32 LE (<I) (4)      - DataLength
            # Offset 24: Uint32 LE (<I) (4)      - Reserved (0)
            tid = struct.unpack('<I', data[2:6])[0]
            api_version = struct.unpack('>H', data[6:8])[0]
            flag = struct.unpack('>H', data[8:10])[0]
            msg_type = struct.unpack('<H', data[10:12])[0]
            raw_imei = struct.unpack('<Q', data[12:20])[0]
            data_len = struct.unpack('<I', data[20:24])[0]
            reserved = struct.unpack('<I', data[24:28])[0]

            total_packet_len = self.DEVICE_HEADER_SIZE + data_len
            if len(data) < total_packet_len:
                # Partial packet received — wait for full payload
                return None, 0

            consumed = total_packet_len
            raw_payload = data[self.DEVICE_HEADER_SIZE:consumed]

            imei = str(raw_imei) if raw_imei > 0 else (known_imei or "")

            logger.debug(
                f"Dolphin DO-107: TID={tid}, API={api_version}, MsgType={msg_type}, "
                f"Flag=0x{flag:04X}, IMEI={imei}, DataLen={data_len}"
            )

            # 4. Decompress payload if LZ4 compression bit is set
            payload = self._decompress_if_needed(raw_payload, flag)
            if payload is None:
                logger.error(f"Dolphin: Failed to decompress payload for IMEI {imei}, TID {tid}")
                return None, consumed

            # 5. Dispatch based on MessageType
            return self._handle_message(
                msg_type=msg_type,
                tid=tid,
                imei=imei,
                payload=payload,
                consumed=consumed,
            )

        except Exception as exc:
            logger.error(f"Dolphin DO-107 decoder error: {exc}", exc_info=True)
            return None, 1

    # ================================================================== #
    #  Decompression & Response Building                                   #
    # ================================================================== #

    def _decompress_if_needed(self, data: bytes, flag: int) -> Optional[bytes]:
        """Decompress payload using LZ4 if Bit 0 of Flag is set."""
        if not (flag & 0x0001):
            return data

        if not lz4:
            logger.error("Dolphin DO-107: LZ4 package not installed but compressed payload received")
            return None

        try:
            return lz4.block.decompress(data)
        except Exception:
            try:
                # Fallback if compressed without prepended uncompressed size
                return lz4.block.decompress(data, uncompressed_size=1024 * 1024)
            except Exception as e:
                logger.error(f"Dolphin DO-107 LZ4 decompression failed: {e}")
                return None

    def _build_server_packet(self, tid: int, msg_type: int, payload: bytes = b'') -> bytes:
        """
        Build an 18-byte server-to-device packet with matching TID and payload.
        Offset 0:  Uint16 (2)         - Protocol Head: 0xABAB
        Offset 2:  Uint32 LE (<I) (4) - TID
        Offset 6:  Uint16 BE (>H) (2) - Flag: 0x0000
        Offset 8:  Uint16 LE (<H) (2) - Message Type
        Offset 10: Uint32 LE (<I) (4) - DataLength
        Offset 14: Uint32 LE (<I) (4) - Reserved: 0x00000000
        Offset 18: Bytes (DataLength) - Data
        """
        header = (
            self.HEADER_MAGIC +
            struct.pack('<I', tid) +
            struct.pack('>H', 0) +
            struct.pack('<H', msg_type) +
            struct.pack('<I', len(payload)) +
            struct.pack('<I', 0)
        )
        return header + payload

    # ================================================================== #
    #  Message Handling                                                   #
    # ================================================================== #

    def _handle_message(
        self,
        msg_type: int,
        tid: int,
        imei: str,
        payload: bytes,
        consumed: int,
    ) -> Tuple[Union[NormalizedPosition, Dict[str, Any], None], int]:
        """Process deserialized protobuf payload according to MessageType."""

        # ── 1. DataPack_Request (MessageType 1) ───────────────────────
        if msg_type == Messages_pb2.DataPack_Request:
            req = Messages_pb2.DataPackRequest()
            req.ParseFromString(payload)

            positions: List[NormalizedPosition] = []
            for pt in req.Points:
                pos = self._convert_datapoint_to_position(pt, imei)
                if pos:
                    positions.append(pos)

            # Build DataPack_Response (MessageType 2) confirming receipt
            resp = Messages_pb2.DataPackResponse(Response=Messages_pb2.DataPack_OK)
            ack = self._build_server_packet(
                tid=tid,
                msg_type=Messages_pb2.DataPack_Response,
                payload=resp.SerializeToString(),
            )

            result: Dict[str, Any] = {
                'imei': imei,
                'response': ack,
            }
            if positions:
                result['position'] = positions[0]
                result['extra_positions'] = positions[1:]

            return result, consumed

        # ── 2. Authentication_Request (MessageType 7) ─────────────────
        elif msg_type == Messages_pb2.Authentication_Request:
            auth_req = Messages_pb2.AuthenticateRequest()
            try:
                auth_req.ParseFromString(payload)
                auth_code = auth_req.Code
            except Exception:
                auth_code = ""

            logger.info(f"Dolphin DO-107 login/auth: IMEI={imei}, Code={auth_code}")

            # Send Authenticate_Response (MessageType 8) with valid code
            resp = Messages_pb2.AuthenticateResponse(Code=Messages_pb2.Authenticate_Valid)
            ack = self._build_server_packet(
                tid=tid,
                msg_type=Messages_pb2.Authentication_Response,
                payload=resp.SerializeToString(),
            )

            return {
                'event': 'login',
                'imei': imei,
                'response': ack,
            }, consumed

        # ── 3. OnlinePosition_Request (MessageType 9) ─────────────────
        elif msg_type == Messages_pb2.OnlinePosition_Request:
            positions: List[NormalizedPosition] = []

            # Try parsing as DataPackRequest first, fallback to single DataPoint
            try:
                req = Messages_pb2.DataPackRequest()
                req.ParseFromString(payload)
                for pt in req.Points:
                    pos = self._convert_datapoint_to_position(pt, imei)
                    if pos:
                        positions.append(pos)
            except Exception:
                try:
                    single_pt = Messages_pb2.DataPoint()
                    single_pt.ParseFromString(payload)
                    pos = self._convert_datapoint_to_position(single_pt, imei)
                    if pos:
                        positions.append(pos)
                except Exception as e:
                    logger.warning(f"Dolphin: Failed to parse OnlinePosition payload: {e}")

            if positions:
                return {
                    'imei': imei,
                    'position': positions[0],
                    'extra_positions': positions[1:],
                }, consumed
            return {'imei': imei}, consumed

        # ── 4. Ping / Keep-Alive (MessageType 30) ─────────────────────
        elif msg_type == Messages_pb2.Ping:
            logger.debug(f"Dolphin DO-107: Ping received from {imei}, sending Pong")
            ack = self._build_server_packet(
                tid=tid,
                msg_type=Messages_pb2.Pong,
                payload=b'',
            )
            return {
                'imei': imei,
                'response': ack,
            }, consumed

        # ── 5. Command_Response (MessageType 61) ──────────────────────
        elif msg_type == Messages_pb2.Command_Response:
            cmd_resp = Messages_pb2.CommandResponse()
            response_text = ""
            try:
                cmd_resp.ParseFromString(payload)
                response_text = cmd_resp.Response
            except Exception as e:
                logger.warning(f"Dolphin: Failed to parse CommandResponse: {e}")

            logger.info(f"Dolphin DO-107 Command Response from {imei}: {response_text}")
            return {
                'event': 'command_ack',
                'imei': imei,
                'response_text': response_text,
            }, consumed

        # ── 6. Crash_Data_Request (MessageType 90) ───────────────────
        elif msg_type == Messages_pb2.Crash_Data_Request:
            crash = Messages_pb2.CrashData()
            positions: List[NormalizedPosition] = []
            try:
                crash.ParseFromString(payload)
                for pt in crash.PointData:
                    pos = self._convert_datapoint_to_position(pt, imei)
                    if pos:
                        pos.sensors['crash_detection'] = crash.Level or 1
                        positions.append(pos)
            except Exception as e:
                logger.warning(f"Dolphin: Failed to parse CrashData: {e}")

            resp = Messages_pb2.CrashDataResponse(Code=Messages_pb2.CrashData_OK)
            ack = self._build_server_packet(
                tid=tid,
                msg_type=Messages_pb2.Crash_Data_Response,
                payload=resp.SerializeToString(),
            )

            result: Dict[str, Any] = {
                'imei': imei,
                'response': ack,
            }
            if positions:
                result['position'] = positions[0]
                result['extra_positions'] = positions[1:]

            return result, consumed

        # ── 7. Config & Other responses ───────────────────────────────
        elif msg_type in (Messages_pb2.Config_Set_Response, Messages_pb2.Config_Get_Response):
            logger.info(f"Dolphin DO-107 Config response (type {msg_type}) from {imei}")
            return {'event': 'command_ack', 'imei': imei, 'response_text': f"ConfigResponse(type={msg_type})"}, consumed

        elif msg_type == Messages_pb2.DeviceInfo_Response:
            logger.info(f"Dolphin DO-107 DeviceInfo response from {imei}")
            return {'imei': imei}, consumed

        # Default fallback
        logger.debug(f"Dolphin DO-107 unhandled message type {msg_type} from {imei}")
        return {'imei': imei}, consumed

    # ================================================================== #
    #  Point & Sensor Conversion                                          #
    # ================================================================== #

    def _convert_datapoint_to_position(
        self,
        pt: Messages_pb2.DataPoint,
        imei: str,
    ) -> Optional[NormalizedPosition]:
        """Convert a Dolphin DataPoint protobuf message to Routario NormalizedPosition."""
        lat = float(pt.Latitude)
        lon = float(pt.Longitude)
        alt = float(pt.Altitude)
        speed = float(pt.Speed)
        course = float(pt.Bearing)
        sats = int(pt.Satellites)

        # Device timestamp (fixed32 epoch seconds)
        if pt.Timestamp > 0:
            device_time = datetime.fromtimestamp(pt.Timestamp, tz=timezone.utc)
        else:
            device_time = datetime.now(timezone.utc)

        hdop = round(float(pt.HDOP) * 0.1, 2) if pt.HDOP > 0 else None
        ignition: Optional[bool] = None
        sensors: Dict[str, Any] = {}

        # Alarm code from pt.Alarm
        alarm_val = int(pt.Alarm)
        if alarm_val > 0:
            sensors['alarm'] = alarm_val
            sensors['alarm_type'] = Config_pb2.AlarmType.Name(alarm_val) if hasattr(Config_pb2, "AlarmType") else str(alarm_val)

        # Map IO elements from parallel lists IOList_ID and IOList_Value
        io_count = min(len(pt.IOList_ID), len(pt.IOList_Value))
        for i in range(io_count):
            io_id = int(pt.IOList_ID[i])
            raw_val = pt.IOList_Value[i]

            if io_id in self.IO_MAPPINGS:
                name, mult, cast_type = self.IO_MAPPINGS[io_id]
                if cast_type == "bool":
                    val = bool(raw_val)
                elif cast_type == "sleep":
                    val = self.SLEEP_MODES.get(raw_val, str(raw_val))
                elif cast_type == "str":
                    val = str(raw_val)
                elif mult != 1.0:
                    val = round(float(raw_val) * mult, 3)
                else:
                    val = raw_val

                sensors[name] = val

                # Special field mappings
                if io_id == 10:  # Alarm_Ignition
                    ignition = bool(raw_val)
                elif io_id == 11:  # Alarm_Movement
                    sensors['motion'] = bool(raw_val)
                elif io_id == 30:  # Alarm_GsmSignal
                    sensors['rssi'] = raw_val
                elif io_id == 40:  # Alarm_ExternalVoltage
                    sensors['power'] = round(float(raw_val) * mult, 3)
                elif io_id == 21 and hdop is None:  # Alarm_GnssHDOP
                    hdop = round(float(raw_val) * mult, 2)
                elif io_id == 4 and course == 0.0:  # Alarm_Angle
                    course = float(raw_val)
                elif io_id == 5 and speed == 0.0:  # Alarm_Speed
                    speed = float(raw_val)
            else:
                sensors[f"io_{io_id}"] = raw_val

        # Drop record if lat=0 and lon=0 (no GPS fix)
        if abs(lat) < 0.0001 and abs(lon) < 0.0001:
            logger.debug(f"Dolphin: Dropping point with (0,0) coordinates for IMEI {imei}")
            return None

        return NormalizedPosition(
            imei=imei,
            protocol="dolphin",
            device_time=device_time,
            server_time=datetime.now(timezone.utc),
            latitude=lat,
            longitude=lon,
            altitude=alt,
            speed=speed,
            course=course,
            satellites=sats,
            hdop=hdop,
            ignition=ignition,
            sensors=sensors,
            raw_data={
                'alarm': alarm_val,
                'point_hdop': pt.HDOP,
            },
        )

    # ================================================================== #
    #  Command Encoding                                                   #
    # ================================================================== #

    async def encode_command(self, command_type: str, params: Dict[str, Any]) -> bytes:
        """
        Encode an outbound command for the Dolphin DO-107 device.
        Uses MessageType 60 (Command_Request) with CommandRequest protobuf payload.
        """
        if not params:
            params = {}

        cmd_info = self.COMMAND_REGISTRY.get(command_type.lower())
        cmd_str = ""

        if command_type.lower() == 'custom':
            cmd_str = params.get('payload', '').strip()
        elif cmd_info:
            cmd_str = cmd_info.get('cmd', '')
            if cmd_info.get('requires_params'):
                extra = {k: v for k, v in params.items() if k != 'payload' and v}
                if extra:
                    param_str = ' '.join(str(v) for v in extra.values())
                    cmd_str = f"{cmd_str} {param_str}"
                elif params.get('payload'):
                    cmd_str = f"{cmd_str} {params['payload']}"

        if not cmd_str:
            logger.warning(f"Dolphin: Unknown command or empty payload for {command_type}")
            return b''

        req = Messages_pb2.CommandRequest(Command=cmd_str)
        payload = req.SerializeToString()

        tid = self._cmd_counter
        self._cmd_counter = (self._cmd_counter + 1) & 0xFFFFFFFF

        return self._build_server_packet(
            tid=tid,
            msg_type=Messages_pb2.Command_Request,
            payload=payload,
        )

    def get_available_commands(self) -> List[str]:
        return list(self.COMMAND_REGISTRY.keys())

    def get_command_info(self, command: str) -> Dict[str, Any]:
        info = self.COMMAND_REGISTRY.get(command.lower())
        if info:
            return {
                'description': info.get('description', ''),
                'example': info.get('example', ''),
                'requires_params': info.get('requires_params', False),
            }
        return {'description': 'Unknown command', 'example': '', 'requires_params': False}
