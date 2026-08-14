# Changelog

All notable changes to this module are documented in this file.

## [2.1.0] — 2026-08-14

### Added — WebSocket real-time metering

- **New config option** `enableWebSocketMeters`: enables a push-based WebSocket connection to the amplifier (`ws://<host>:<port>/socket.io/`) for real-time meter data. Read-only — no commands are sent.
- **New file** `src/ws.ts`: WebSocket client with auto-reconnect (5s), ping keepalive (20s), and Socket.IO v4 handshake.
- **New file** `src/meters.ts`: typed meter structures and `mergeMeters()` to integrate WS data into device status.
- **~40 new variables** (per channel, per device) when WebSocket is enabled:
  - Per-channel: V post peak/rms (V), I post peak/rms (A), headroom, gain reduction total + dB, protection, protection thermal/unrecoverable, load monitor, load detect, pilot tone voltage, detected impedance RMS.
  - Device-level: DSP load avg/peak (%), fan (%), standby, hardware fault, moderate/high over-temperature, CPU/memory/disk usage (%), temperatures (digi, adlink, MOS left/right), ampli module temps (A/B per module).
- **9 new boolean feedbacks** (WebSocket-based):
  - `channelProtection`, `channelProtectionThermal`, `channelProtectionUnrecoverable`
  - `channelLoadMonitor`
  - `channelGainReduction` (with configurable threshold)
  - `deviceHwFault`, `deviceOverTempModerate`, `deviceOverTempHigh`, `deviceStandby`
- **New layered presets** (Companion 5.0+, with `simple` fallback via `alternatives`):
  - **Device Monitor**: DSP load, fan, CPU, temperature + conditional borders (red=hw fault, orange=over-temp).
  - **CHx VU Meter**: dual vertical gauges (V in green→yellow→red, I in blue→yellow→red) + conditional borders (red=protection, orange=thermal limiting).
  - **CHx Monitor**: V, I, headroom text display + gain reduction indicator.
  - Presets are generated **per device** in multi-device mode (section "Monitoring [IP]").

### Changed

- Added `ws` as a runtime dependency (was already in devDependencies via `@types/ws`).
- `src/main.ts`: manages WebSocket clients per device (`startWebSocketClients`/`stopWebSocketClients`), integrated into polling lifecycle.
- `companion/HELP.md`: fully updated with WebSocket config, feedbacks, variables, presets, and troubleshooting.

### Tested against

- Powersoft Ottocanali 8K4 (firmware 1.12.0.782) at 192.168.20.36.
- Fast meters: ~10 updates/second (8 channels, DSP load ~69%, V/I peak/rms, headroom, gain reduction).
- Slow meters: ~1 update/second (4 ampli modules 37-41°C, 8 output channels, CPU 33%, fan 0, standby).

---

## [2.0.0] — 2025-08-18

### Added

- Multi-device support (comma/newline separated IPs via `devicesCsv`).
- UDP feedback polling (`enableUdpFeedback`) via UDP 1234 for power, mutes, and alarms.
- Auto-discovery mode (UDP broadcast on port 8004).
- Per-channel diagnostics: tone generator, impedance measure, tone detection.
- Per-channel UDP alarm feedbacks: over-temp, low load, rail fault, other fault, thermal SOA, AUX current fault.
- Upgrade scripts for config migration.

### Changed

- Migrated to Companion Module API 2.0 (ESM, `@companion-module/base`).
- TypeScript with `verbatimModuleSyntax`, LF line endings, Prettier formatting.
- Robust error handling with per-device backoff for unreachable hosts.

---

## [1.0.0] — Initial release

- Basic single-device control: power on/off, channel mute, channel gain.
- HTTP polling for device info, channel state, power state.
- Variables for model, firmware, IP, power, temperature, fan speed, per-channel mute/gain/clip/signal/temp/impedance.
- Feedbacks: power state, channel mute, channel clip, channel signal, channel temp warning/critical, channel impedance warning.
- Presets: power on/off/toggle, mute toggle, gain up/down/set, clip indicator, diagnostics.
