# companion-module-powersoft-amplifier

Bitfocus Companion module to control and monitor Powersoft amplifiers over the network.

## Overview

This module controls Powersoft amplifiers via the HTTP API (port 80) with optional UDP feedback polling and WebSocket real-time metering.

- Supports single-device and multi-device setups.
- Targets Ottocanali and similar series using the UNICA API.
- **HTTP polling** for power, mute, gain, device info (default, port 80).
- **UDP feedback** for power/mutes/alarms via UDP 1234 (`enableUdpFeedback`).
- **WebSocket real-time meters** for V/I levels, temperatures, protection, DSP load, etc. (`enableWebSocketMeters`, requires Companion 5.0+).

## Documentation

Detailed user-facing documentation (configuration, actions, variables, feedback, and notes) lives in:

- [companion/HELP.md](companion/HELP.md)
- [CHANGELOG.md](CHANGELOG.md) — release notes and version history
- Additional technical docs in [docs/](docs/)

## Beta: Auto Discovery Mode

This module includes a beta UDP-based auto-discovery for Powersoft amplifiers.

- **How it works**
  - Broadcasts a Powersoft discovery packet on UDP port `8004` with a hardcoded public RSA key and client name.
  - Discovered devices are parsed and listed live in the config as you scan.

- **Enabling**
  - In the instance config, enable `Scan network for Powersoft amplifiers (UDP 8004)`.
  - Use the `Select discovered amplifier(s)` multidropdown to pick one or more devices.

- **Single vs Multi mode**
  - `Mode = Single device`: The first selected device will populate the `Hostname/IP` field.
  - `Mode = Multiple devices`: All selected devices populate `Devices IPs` (comma-separated) in `devicesCsv`.

- **Notes**
  - The RSA public key and client name are hardcoded as per Powersoft documentation; they are not configurable.
  - Discovery runs only while `Scan` is enabled; disabling scan clears the in-memory discovered list and selection.
  - Discovery is network broadcast; ensure your environment allows UDP broadcast on port 8004.
  - This is a beta feature and may evolve. Please report issues/firmware quirks with debug logs if possible.

- **Troubleshooting**
  - If devices don’t appear, confirm Layer-2 broadcast reachability and that the amplifiers are on the same subnet.
  - Some environments may restrict broadcast; try configuring `Host` or `Devices IPs` manually as a fallback.

## License

MIT
