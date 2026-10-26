"""
Dolphin DO-107 GPS Device Simulator
Simulates a Dolphin DO-107 tracker connecting over TCP to port 5050,
authenticating, and streaming real-time Protobuf v3 positions with telemetry.
"""
import socket
import struct
import time
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add project root to sys.path
_root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_root_dir / "app"))

from protocols.dolphin_proto import Messages_pb2, Config_pb2

try:
    import lz4.block
except ImportError:
    lz4 = None

SERVER_HOST = '127.0.0.1'
SERVER_PORT = 5050
IMEI = 860675040292649
UPDATE_INTERVAL = 5  # seconds
USE_LZ4 = False


def build_device_packet(tid: int, msg_type: int, payload: bytes, imei: int = IMEI, compress: bool = False) -> bytes:
    flag = 0
    data = payload
    if compress and lz4:
        flag = 0x0001
        data = lz4.block.compress(payload, store_size=True)

    header = (
        b'\xab\xab' +
        struct.pack('<I', tid) +
        struct.pack('>H', 1) +          # API Version 1
        struct.pack('>H', flag) +       # Flag
        struct.pack('<H', msg_type) +   # MessageType
        struct.pack('<Q', imei) +       # IMEI (uint64 LE)
        struct.pack('<I', len(data)) +  # DataLength (uint32 LE)
        struct.pack('<I', 0)            # Reserved (0)
    )
    return header + data


def parse_server_packet(data: bytes) -> tuple:
    if len(data) < 18 or data[0:2] != b'\xab\xab':
        return None
    tid = struct.unpack('<I', data[2:6])[0]
    flag = struct.unpack('>H', data[6:8])[0]
    msg_type = struct.unpack('<H', data[8:10])[0]
    data_len = struct.unpack('<I', data[10:14])[0]
    reserved = struct.unpack('<I', data[14:18])[0]
    payload = data[18:18 + data_len]
    return tid, flag, msg_type, payload


def main():
    print(f"Connecting to Dolphin DO-107 listener at {SERVER_HOST}:{SERVER_PORT}...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((SERVER_HOST, SERVER_PORT))
    print(f"Connected! Simulating DO-107 IMEI={IMEI}")

    tid = 1

    # 1. Send Authentication_Request (MessageType = 7)
    auth_req = Messages_pb2.AuthenticateRequest(Code="DOLPHIN_TEST")
    packet = build_device_packet(tid=tid, msg_type=7, payload=auth_req.SerializeToString())
    sock.sendall(packet)
    print(f"Sent Authentication_Request (TID={tid})")

    resp = sock.recv(1024)
    parsed = parse_server_packet(resp)
    if parsed:
        r_tid, _, r_msg_type, r_payload = parsed
        print(f"Received Server Response: TID={r_tid}, MsgType={r_msg_type}")
        if r_msg_type == 8:
            auth_resp = Messages_pb2.AuthenticateResponse()
            auth_resp.ParseFromString(r_payload)
            print(f"Authentication Code: {auth_resp.Code} (1=Valid)")

    # 2. Start streaming position records
    lat = 31.877283
    lon = 54.364921
    alt = 1236.0
    odometer = 42000

    try:
        while True:
            tid += 1
            time.sleep(UPDATE_INTERVAL)

            # Move slightly
            lat += (random.random() - 0.5) * 0.001
            lon += (random.random() - 0.5) * 0.001
            speed = round(random.uniform(20.0, 70.0), 1)
            course = round(random.uniform(0.0, 359.0), 1)
            odometer += int(speed * (UPDATE_INTERVAL / 3.6))

            req = Messages_pb2.DataPackRequest()
            pt = req.Points.add()
            pt.Latitude = lat
            pt.Longitude = lon
            pt.Altitude = alt
            pt.Speed = speed
            pt.Bearing = course
            pt.Satellites = 12
            pt.HDOP = 10  # 1.0
            pt.Timestamp = int(time.time())
            pt.Alarm = Config_pb2.Alarm_Normal

            # Telemetry IO values
            pt.IOList_ID.append(Config_pb2.Alarm_Ignition)
            pt.IOList_Value.append(1)

            pt.IOList_ID.append(Config_pb2.Alarm_Movement)
            pt.IOList_Value.append(1)

            pt.IOList_ID.append(Config_pb2.Alarm_ExternalVoltage)
            pt.IOList_Value.append(12600)  # 12.6V

            pt.IOList_ID.append(Config_pb2.Alarm_BatteryVoltage)
            pt.IOList_Value.append(4100)   # 4.1V

            pt.IOList_ID.append(Config_pb2.Alarm_GsmSignal)
            pt.IOList_Value.append(28)

            pt.IOList_ID.append(Config_pb2.Alarm_TotalOdometer)
            pt.IOList_Value.append(odometer)

            data_packet = build_device_packet(
                tid=tid,
                msg_type=1,
                payload=req.SerializeToString(),
                compress=USE_LZ4,
            )
            sock.sendall(data_packet)
            print(f"Sent DataPack_Request (TID={tid}): lat={lat:.6f}, lon={lon:.6f}, speed={speed} km/h")

            # Read server ACK
            ack_data = sock.recv(1024)
            ack = parse_server_packet(ack_data)
            if ack:
                a_tid, _, a_type, a_payload = ack
                print(f"  -> Server ACK: TID={a_tid}, MsgType={a_type}")

    except KeyboardInterrupt:
        print("\nStopping Dolphin simulator.")
    finally:
        sock.close()


if __name__ == "__main__":
    main()
