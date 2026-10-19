"""
Driver Auto-Assignment Engine

Evaluates each driver's assignment_rule against incoming position data
and updates DeviceState.current_driver_id accordingly.

State keys in DeviceState.alert_states:
  auto_assigned_driver_id   – ID of auto-assigned driver (None = manual/unset)
  auto_assign_mode          – snapshot of mode at assignment time
  auto_assign_clear         – snapshot of clear setting at assignment time
  auto_assign_grace_period  – snapshot of grace period at assignment time
  auto_assign_rule_last_match – ISO timestamp of last successful rule match
"""
import json
import logging
from datetime import datetime
from typing import List

import rule_engine

from models.models import Driver, DeviceState, Trip
from models.schemas import NormalizedPosition
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)
_rule_cache: dict = {}


def _set_nested(root: dict, parts: list, val) -> None:
    d = root
    for part in parts[:-1]:
        if not isinstance(d, dict):
            return
        curr = d.get(part)
        if not isinstance(curr, dict):
            d[part] = {"_value": curr, "value": curr} if curr is not None else {}
        d = d[part]

    if isinstance(d, dict) and parts:
        last = parts[-1]
        curr = d.get(last)
        if isinstance(curr, dict) and not isinstance(val, dict):
            curr["_value"] = val
            curr["value"] = val
        elif isinstance(curr, dict) and isinstance(val, dict):
            curr.update(val)
        else:
            d[last] = val


def build_rule_context(position: NormalizedPosition) -> dict:
    sensors = position.sensors if isinstance(position.sensors, dict) else {}
    ctx = {"speed": position.speed or 0, "ignition": position.ignition, **sensors}

    for k, v in list(sensors.items()):
        if not isinstance(k, str) or "." not in k:
            continue
        parts = [p for p in k.split(".") if p]
        if len(parts) < 2:
            continue

        _set_nested(ctx, parts, v)
        _set_nested(ctx, [p.capitalize() for p in parts], v)
        _set_nested(ctx, [p.lower() for p in parts], v)

    ble_val = ctx.get("ble")
    beacons = ctx.get("beacon_ids") or (ble_val.get("beacons") if isinstance(ble_val, dict) else None)
    if beacons:
        ctx.setdefault("beacon_ids", beacons)
        for ble_key, beacon_key in [("ble", "beacons"), ("Ble", "Beacons"), ("BLE", "Beacons")]:
            curr = ctx.get(ble_key)
            if not isinstance(curr, dict):
                ctx[ble_key] = {"_value": curr, "value": curr} if curr is not None else {}
            ctx[ble_key].setdefault(beacon_key, beacons)

    return ctx


_build_ctx = build_rule_context



def _eval_rule(rule_str: str, ctx: dict) -> bool:
    try:
        if rule_str not in _rule_cache:
            _rule_cache[rule_str] = rule_engine.Rule(rule_str)
        return _rule_cache[rule_str].matches(ctx)
    except Exception:
        return False


def _clear(state: DeviceState):
    state.current_driver_id = None
    state.alert_states = {
        **(state.alert_states or {}),
        'auto_assigned_driver_id': None,
        'auto_assign_mode': None,
        'auto_assign_clear': None,
        'auto_assign_grace_period': None,
        'auto_assign_rule_last_match': None,
    }


def handle_ignition_off(state: DeviceState):
    _handle_event('ignition_off', state)


def handle_trip_end(state: DeviceState):
    _handle_event('trip_end', state)


def _handle_event(event: str, state: DeviceState):
    a = state.alert_states or {}
    auto_id = a.get('auto_assigned_driver_id')
    if auto_id is None or state.current_driver_id != auto_id:
        return
    if a.get('auto_assign_clear') == event:
        _clear(state)


async def evaluate(session: AsyncSession, device, state: DeviceState,
                   position: NormalizedPosition, device_time: datetime):
    a = state.alert_states or {}
    auto_id = a.get('auto_assigned_driver_id')

    # Manual assignment — don't interfere
    if state.current_driver_id is not None and state.current_driver_id != auto_id:
        return

    ctx = _build_ctx(position)

    # Already auto-assigned
    if state.current_driver_id is not None and state.current_driver_id == auto_id:
        mode = a.get('auto_assign_mode', 'one_time')
        if mode == 'one_time':
            return

        # Continuous — re-evaluate and keep the driver only while the rule
        # continues matching. The grace period tolerates short sensor gaps.
        driver = await session.get(Driver, auto_id)
        if driver and driver.assignment_rule:
            if _eval_rule(driver.assignment_rule, ctx):
                state.alert_states = {**a, 'auto_assign_rule_last_match': device_time.isoformat()}
                return
            grace = int(a.get('auto_assign_grace_period') or 0)
            last = a.get('auto_assign_rule_last_match')
            if last and grace > 0:
                elapsed = (device_time - datetime.fromisoformat(last).replace(tzinfo=None)).total_seconds()
                if elapsed < grace:
                    return
        _clear(state)
        return

    # No driver assigned — find first matching driver
    for driver in await _eligible(session, device):
        if not driver.assignment_rule:
            continue
        if _eval_rule(driver.assignment_rule, ctx):
            mode = driver.assignment_mode or 'one_time'
            state.current_driver_id = driver.id
            state.alert_states = {
                **a,
                'auto_assigned_driver_id': driver.id,
                'auto_assign_mode': mode,
                'auto_assign_clear': 'rule_stops' if mode == 'continuous' else (driver.assignment_clear or 'never'),
                'auto_assign_grace_period': driver.assignment_grace_period or 0,
                'auto_assign_rule_last_match': device_time.isoformat(),
            }
            if state.active_trip_id:
                trip = await session.get(Trip, state.active_trip_id)
                if trip:
                    trip.driver_id = driver.id
            break


async def _eligible(session: AsyncSession, device) -> List[Driver]:
    result = await session.execute(
        select(Driver).where(
            Driver.assignment_rule.isnot(None),
            Driver.company_id == device.company_id,
        )
    )
    out = []
    for d in result.scalars().all():
        vehicles = d.assignment_vehicles
        if isinstance(vehicles, str):
            try:
                vehicles = json.loads(vehicles)
            except (json.JSONDecodeError, ValueError):
                vehicles = None
        if vehicles is not None and not isinstance(vehicles, list):
            vehicles = None
        if not vehicles or device.id in vehicles:
            out.append(d)
    return out
