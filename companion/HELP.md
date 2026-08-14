## Powersoft Amplifiers

Control and monitor Powersoft amplifiers via the network API. Supports single or multiple devices, channel mute/gain control, power control, real-time WebSocket metering, and diagnostics.

## Configuration

- **Mode** (`mode`): Single device or Multiple devices.
  - Single: set a single Host/Port.
  - Multiple: leave Host/Port empty and fill Devices IPs list.
- **Amplifier Hostname/IP** (`host`): Used in Single mode.
- **Port** (`port`): Default 80.
- **Polling Interval (ms)** (`pollingInterval`): Default 1000ms.
- **Devices IPs** (`devicesCsv`): In Multi mode, comma or newline separated list of device IPs.
- **Maximum Number of Channels** (`maxChannels`): Default 8.
- **Decimal Places** (`decimalPlaces`): Default 3 (formatting for variables/labels).
- **Power/Standby Parameter Path (override)** (`powerPath`): Optional manual path override.
- **UDP feedback (second API)**
  - Enable UDP feedback polling (`enableUdpFeedback`): Reads power/mutes/alarms via UDP 1234.
  - UDP Device Port (`udpPort`): Default 1234.
  - UDP Poll Interval (`udpPollInterval`): Default 1000ms.
  - Force answer_port=0 (`udpAnswerPortZero`): For firmware requiring 0.
- **WebSocket real-time meters** (`enableWebSocketMeters`): When enabled, the module connects to the amplifier's WebSocket endpoint (`ws://<host>:<port>/socket.io/`) and receives real-time meter data approximately 10 times per second (fast meters) and once per second (slow meters). This is a read-only connection — no commands are sent to the amplifier.

Notes:

- HTTPS, username, password options exist but are hidden/not required in typical setups.

Compatibility:

- This module has been tested with Powersoft Ottocanali series amplifiers (firmware 1.12+). Other series may work, but paths and features can vary by model and firmware.
- The WebSocket metering feature requires Companion 5.0+ (API 2.1) and a firmware that exposes the Socket.IO endpoint on port 80.

## Actions

- **Power**
  - Power On / Power Off / Toggle Power
- **Channel Mute**
  - Mute Channel / Unmute Channel / Toggle Mute Channel
- **Channel Gain**
  - Set Channel Gain (absolute, dB)
  - Adjust Channel Gain (relative, ±dB)
- **Diagnostics – Output Speaker Aux Line**
  - Tone Generator: Enable/Disable, Frequency, Level (per channel)
  - Impedance Measure: Enable/Disable, Frequency, Min/Max Level (per channel)
  - Tone Detection: Enable/Disable, Frequency, Min/Max Threshold (per channel)
  - Convenience actions to Stop All Diagnostics (per channel and all channels)

## Presets

- **Per-channel Mute Toggle**: For each channel `CHx`
  - Default: label `UNMUTED`, green background
  - When muted (feedback driven): label `MUTED`, red background
- **Gain Up/Down**: Relative +1 dB / −1 dB.
- **Clip Indicator**: Highlights when channel is clipping (if supported by device).
- **Power**: On / Off / Toggle.
- **Diagnostics**:
  - Start/Stop Output Tone Generator (per channel and all channels)
  - Start/Stop Impedance Measure (per channel and all channels)
  - Enable/Disable Tone Detection (per channel and all channels)
- **Monitoring (WebSocket)** — requires `enableWebSocketMeters` enabled:
  - **Device Monitor**: Shows DSP load, fan speed, CPU usage, temperature. Border turns red on hardware fault, orange on over-temperature.
  - **CHx VU Meter**: Dual vertical gauges (V post RMS in green/blue, I post RMS in blue). Border turns red on protection, orange on thermal limiting.
  - **CHx Monitor**: Text display with V, I, and headroom values. Title turns orange when gain reduction/limiting is active.
  - These presets use Companion 5.0 layered graphics with `alternatives` fallback to `simple` for older hosts.

## Feedbacks

- **Power State** (`powerState`)
- **Channel Mute State** (`channelMute`) – drives preset color and label
- **Device Connected** (`deviceConnected`)
- **Device Fault** (`deviceFault`)
- Optional, if supported by device/paths:
  - **Channel Clip** (`channelClip`)
  - **Channel Signal Present** (`channelSignal`)
  - **Channel Temperature Warning/Critical** (`channelTempWarning` / `channelTempCritical`)
  - **Channel Impedance Warning** (`channelImpedanceWarning`)
- UDP-based (require `enableUdpFeedback`):
  - **Channel Over-Temperature** (`channelOverTemp`)
  - **Channel Low Load** (`channelLowLoad`)
  - **Channel Rail Fault** (`channelRailFault`)
  - **Channel Other Fault** (`channelOtherFault`)
  - **Channel Thermal SOA** (`channelThermalSOA`)
  - **Channel AUX Current Fault** (`channelAuxCurrentFault`)
- WebSocket-based (require `enableWebSocketMeters`):
  - **Channel Protection** (`channelProtection`) — red when protection is active
  - **Channel Protection Thermal Limiting** (`channelProtectionThermal`) — orange when thermal limiting
  - **Channel Protection Unrecoverable** (`channelProtectionUnrecoverable`)
  - **Channel Load Monitor** (`channelLoadMonitor`)
  - **Channel Gain Reduction Active** (`channelGainReduction`) — true when limiter is reducing gain below threshold
  - **Device Hardware Fault** (`deviceHwFault`)
  - **Device Moderate Over-Temperature** (`deviceOverTempModerate`)
  - **Device High Over-Temperature** (`deviceOverTempHigh`)
  - **Device Standby** (`deviceStandby`)

## Variables (selection)

- Per-channel: mute, gain (dB), limiter threshold (dB), signal present, clip, temperature, load impedance
- Per-channel critical alarms from UDP READALLALARMS2 (require UDP feedback enabled):
  - Over-Temperature → `ch<nr>_overtemp_<id>`
  - Low Load Protection → `ch<nr>_lowload_<id>`
  - Rail Voltage Fault → `ch<nr>_rail_fault_<id>`
  - Other Fault → `ch<nr>_other_fault_<id>`
  - Thermal SOA → `ch<nr>_thermal_soa_<id>`
  - AUX Current Fault → `ch<nr>_aux_current_fault_<id>`
- WebSocket real-time meters (require `enableWebSocketMeters` enabled):
  - Per-channel: V post peak/rms (V), I post peak/rms (A), headroom, gain reduction total + dB, protection, protection thermal/unrecoverable, load monitor, load detect, pilot tone voltage, detected impedance RMS
  - Device-level: DSP load avg/peak (%), fan (%), standby, hardware fault, moderate/high over-temperature, CPU/memory/disk usage (%), temperatures (digi, adlink, MOS left/right), ampli module temps (A/B per module)
- Device: name, firmware, IP address, power state, fault state
- Speakers: `Speaker <ch> Model` (speaker model name per output channel)

Variable naming:

- All variables are per-device and include a sanitized device identifier suffix (e.g., `name_192_168_1_10`, `sp1_model_192_168_1_10`).
- WebSocket meter variables follow the same pattern (e.g., `ch1_v_rms_192_168_20_36`, `dsp_load_192_168_20_36`).

## Troubleshooting

- Verify amplifier IP(s) and network routing.
- Ensure the device API/port is reachable (default HTTP 80).
- If using UDP feedback, confirm UDP 1234 is allowed and reachable.
- If using WebSocket meters, ensure port 80 is accessible for WebSocket upgrade (no firewall blocking `ws://` upgrade).
- WebSocket meters update ~10x/second (fast) and ~1x/second (slow). If values seem stale, check the module debug log for WS connection/disconnection messages.
- Adjust polling intervals if status feels sluggish or too chatty.
- Check Companion module logs for errors; ensure correct parameter paths when overriding.
