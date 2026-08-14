import { combineRgb, type CompanionPresetDefinitions, type CompanionPresetSection } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { listDevices, sanitizeDeviceId } from './devices.js'

export function UpdatePresets(self: ModuleInstance): {
	structure: CompanionPresetSection[]
	presets: CompanionPresetDefinitions
} {
	const maxChannels = self.config?.maxChannels || 8
	const defaultDevice = listDevices(self.config)[0] || self.config.host || ''
	const wsEnabled = Boolean(self.config.enableWebSocketMeters)

	// Helper to create channel-specific preset definitions
	const createChannelPresets = (channel: number): CompanionPresetDefinitions => {
		const channelName = `CH${channel}`

		return {
			[`mute_toggle_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Mute Toggle`,
				style: {
					text: `${channelName}\\nUNMUTED`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 120, 0), // Green when unmuted
				},
				steps: [
					{
						down: [
							{
								actionId: 'toggleMuteChannel',
								options: {
									device: defaultDevice,
									channel: channel,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'channelMute',
						options: {
							device: defaultDevice,
							channel: channel,
						},
						style: {
							text: `${channelName}\\nMUTED`,
							bgcolor: combineRgb(200, 0, 0), // Red when muted
							color: combineRgb(255, 255, 255),
						},
					},
				],
			},

			[`gain_up_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Gain +1 dB`,
				style: {
					text: `${channelName}\\nGAIN ▲ +1dB`,
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(200, 200, 200),
				},
				steps: [
					{
						down: [
							{
								actionId: 'adjustChannelGain',
								options: {
									device: defaultDevice,
									channel: channel,
									adjustment: 1,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			},

			[`gain_down_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Gain -1 dB`,
				style: {
					text: `${channelName}\\nGAIN ▼ -1dB`,
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(200, 200, 200),
				},
				steps: [
					{
						down: [
							{
								actionId: 'adjustChannelGain',
								options: {
									device: defaultDevice,
									channel: channel,
									adjustment: -1,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			},

			[`gain_set_m10_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Gain -10 dB`,
				style: {
					text: `${channelName}\\nSET -10dB`,
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(180, 200, 255),
				},
				steps: [
					{
						down: [{ actionId: 'setChannelGain', options: { device: defaultDevice, channel, gain: -10 } }],
						up: [],
					},
				],
				feedbacks: [],
			},
			[`gain_set_0_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Gain 0 dB`,
				style: {
					text: `${channelName}\\nSET 0dB`,
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(200, 255, 200),
				},
				steps: [
					{
						down: [{ actionId: 'setChannelGain', options: { device: defaultDevice, channel, gain: 0 } }],
						up: [],
					},
				],
				feedbacks: [],
			},
			[`gain_set_p5_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Gain +5 dB`,
				style: {
					text: `${channelName}\\nSET +5dB`,
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 230, 180),
				},
				steps: [
					{
						down: [{ actionId: 'setChannelGain', options: { device: defaultDevice, channel, gain: 5 } }],
						up: [],
					},
				],
				feedbacks: [],
			},

			[`clip_indicator_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Clip Indicator`,
				style: {
					text: `${channelName}\\nCLIP`,
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(200, 200, 200),
				},
				steps: [],
				feedbacks: [],
			},

			[`diag_tone_start_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Tone Start`,
				style: {
					text: `${channelName}\\nTONE ON`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 100, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'startOutputToneGenerator',
								options: { device: defaultDevice, channel, frequency: 1000, level: -20 },
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			},

			[`diag_tone_stop_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Tone Stop`,
				style: {
					text: `${channelName}\\nTONE OFF`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(120, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'stopOutputToneGenerator', options: { device: defaultDevice, channel } }],
						up: [],
					},
				],
				feedbacks: [],
			},

			[`diag_imp_start_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Impedance Start`,
				style: {
					text: `${channelName}\\nIMP ON`,
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 215, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'startImpedanceMeasure',
								options: { device: defaultDevice, channel, frequency: 1000, min: -30, max: -10 },
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			},

			[`diag_imp_stop_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Impedance Stop`,
				style: {
					text: `${channelName}\\nIMP OFF`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(128, 128, 0),
				},
				steps: [
					{
						down: [{ actionId: 'stopImpedanceMeasure', options: { device: defaultDevice, channel } }],
						up: [],
					},
				],
				feedbacks: [],
			},

			[`diag_det_enable_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Detection Enable`,
				style: {
					text: `${channelName}\\nDETECT ON`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 80, 160),
				},
				steps: [
					{
						down: [
							{
								actionId: 'enableToneDetection',
								options: { device: defaultDevice, channel, frequency: 1000, min: -40, max: -10 },
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			},

			[`diag_det_disable_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Detection Disable`,
				style: {
					text: `${channelName}\\nDETECT OFF`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(80, 80, 80),
				},
				steps: [
					{
						down: [{ actionId: 'disableToneDetection', options: { device: defaultDevice, channel } }],
						up: [],
					},
				],
				feedbacks: [],
			},

			[`diag_stop_all_ch${channel}`]: {
				type: 'simple',
				name: `${channelName} Stop All`,
				style: {
					text: `${channelName}\\nSTOP ALL`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(160, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'stopAllDiagnostics', options: { device: defaultDevice, channel } }],
						up: [],
					},
				],
				feedbacks: [],
			},
		}
	}

	// Build per-channel preset definitions
	const channelPresets: CompanionPresetDefinitions = {}
	for (let i = 1; i <= maxChannels; i++) {
		Object.assign(channelPresets, createChannelPresets(i))
	}

	// Global presets
	const globalPresets: CompanionPresetDefinitions = {
		power_on: {
			type: 'simple',
			name: 'Power On',
			style: {
				text: 'POWER\\nON',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 100, 0),
			},
			steps: [
				{
					down: [{ actionId: 'powerOn', options: { device: defaultDevice } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'powerState',
					options: { device: defaultDevice },
					style: {
						bgcolor: combineRgb(0, 200, 0), // Green when on
						color: combineRgb(255, 255, 255),
					},
				},
			],
		},
		power_off: {
			type: 'simple',
			name: 'Power OFF',
			style: {
				text: 'POWER\\nOFF',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(120, 0, 0),
			},
			steps: [
				{
					down: [{ actionId: 'powerOff', options: { device: defaultDevice } }],
					up: [],
				},
			],
			feedbacks: [],
		},
		power_toggle: {
			type: 'simple',
			name: 'Power TOGGLE',
			style: {
				text: 'POWER\nTOGGLE',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(60, 60, 60),
			},
			steps: [
				{
					down: [{ actionId: 'togglePower', options: { device: defaultDevice } }],
					up: [],
				},
			],
			feedbacks: [],
		},

		reset_protection: {
			type: 'simple',
			name: 'Reset Protection',
			style: {
				text: 'RESET\\nPROTECTION',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(128, 0, 0), // Dark red
			},
			steps: [
				{
					down: [{ actionId: 'resetProtection', options: { device: defaultDevice, channel: 0 } }],
					up: [],
				},
			],
			feedbacks: [],
		},

		reset_peak_hold: {
			type: 'simple',
			name: 'Reset Peak Hold',
			style: {
				text: 'RESET\\nPEAK HOLD',
				size: '14',
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(200, 200, 200), // Light gray
			},
			steps: [
				{
					down: [{ actionId: 'resetPeakHold', options: { device: defaultDevice, channel: 0 } }],
					up: [],
				},
			],
			feedbacks: [],
		},

		mute_all_channels: {
			type: 'simple',
			name: 'Mute All Channels',
			style: {
				text: 'MUTE\nALL',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(120, 0, 0),
			},
			steps: [
				{
					down: Array.from({ length: maxChannels }, (_, i) => ({
						actionId: 'muteChannel',
						options: { device: defaultDevice, channel: i + 1 },
					})),
					up: [],
				},
			],
			feedbacks: [],
		},
		unmute_all_channels: {
			type: 'simple',
			name: 'Unmute All Channels',
			style: {
				text: 'UNMUTE\nALL',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 120, 0),
			},
			steps: [
				{
					down: Array.from({ length: maxChannels }, (_, i) => ({
						actionId: 'unmuteChannel',
						options: { device: defaultDevice, channel: i + 1 },
					})),
					up: [],
				},
			],
			feedbacks: [],
		},

		stop_all_diagnostics_all: {
			type: 'simple',
			name: 'Diagnostics Stop All (All CH)',
			style: {
				text: 'DIAG\\nSTOP ALL',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(100, 0, 0),
			},
			steps: [
				{
					down: [{ actionId: 'stopAllDiagnosticsAllChannels', options: { device: defaultDevice } }],
					up: [],
				},
			],
			feedbacks: [],
		},
	}

	// --- WebSocket monitoring presets (layered with gauges) ---
	const monitoringPresets: CompanionPresetDefinitions = {}
	const monitoringStructure: CompanionPresetSection[] = []

	if (wsEnabled) {
		const wsHosts = listDevices(self.config)

		// Helper: create a layered VU meter preset for a channel on a specific device
		const createVuMeterPreset = (channel: number, deviceHost: string): CompanionPresetDefinitions => {
			const ch = channel
			const devId = sanitizeDeviceId(deviceHost)
			// Unique preset id suffix per device to avoid collisions
			const suffix = wsHosts.length > 1 ? `_${devId}` : ''
			const varVrms = `$(Powersoft:ch${ch}_v_rms_${devId})`
			const varIrms = `$(Powersoft:ch${ch}_i_rms_${devId})`
			const varHeadroom = `$(Powersoft:ch${ch}_headroom_${devId})`

			return {
				[`vu_meter_ch${channel}${suffix}`]: {
					type: 'alternatives',
					variants: [
						// Rich layered variant (Companion 5+) — coordinates are percentages 0-100
						{
							type: 'layered',
							name: `CH${channel} VU Meter [${deviceHost}]`,
							elements: [
								{
									id: 'bg',
									type: 'box',
									x: 0,
									y: 0,
									width: 100,
									height: 100,
									color: combineRgb(20, 20, 20),
									borderWidth: 0,
								},
								{
									id: 'title',
									type: 'text',
									x: 0,
									y: 0,
									width: 100,
									height: 18,
									text: `CH${channel}`,
									fontsize: 58,
									fontsizeAllowShrink: true,
									color: combineRgb(255, 255, 255),
									halign: 'center',
									valign: 'center',
									weight: 'bold',
								},
								// V RMS gauge - vertical bar (left half)
								{
									id: 'v_gauge',
									type: 'gauge',
									x: 8,
									y: 22,
									width: 30,
									height: 70,
									value: { isExpression: true, value: `parseFloat(${varVrms}) * 10` },
									min: 0,
									max: 100,
									orientation: 'vertical',
									fillEnabled: true,
									multiColour: true,
									fillWidth: 24,
									trackStyle: 'dimmed',
									trackWidth: 24,
									stops: [
										{ value: 0, color: combineRgb(0, 200, 0), gradient: true },
										{ value: 70, color: combineRgb(255, 255, 0), gradient: true },
										{ value: 90, color: combineRgb(255, 0, 0), gradient: true },
									],
								},
								// I RMS gauge - vertical bar (right half)
								{
									id: 'i_gauge',
									type: 'gauge',
									x: 62,
									y: 22,
									width: 30,
									height: 70,
									value: { isExpression: true, value: `parseFloat(${varIrms}) * 50` },
									min: 0,
									max: 100,
									orientation: 'vertical',
									fillEnabled: true,
									multiColour: true,
									fillWidth: 24,
									trackStyle: 'dimmed',
									trackWidth: 24,
									stops: [
										{ value: 0, color: combineRgb(0, 120, 255), gradient: true },
										{ value: 70, color: combineRgb(255, 255, 0), gradient: true },
										{ value: 90, color: combineRgb(255, 0, 0), gradient: true },
									],
								},
							],
							feedbacks: [
								// Protection -> red border
								{
									feedbackId: 'channelProtection',
									options: { device: deviceHost, channel: channel },
									styleOverrides: [
										{ elementId: 'bg', elementProperty: 'borderColor', override: combineRgb(255, 0, 0) },
										{ elementId: 'bg', elementProperty: 'borderWidth', override: 3 },
									],
								},
								// Thermal limiting -> orange border
								{
									feedbackId: 'channelProtectionThermal',
									options: { device: deviceHost, channel: channel },
									styleOverrides: [
										{ elementId: 'bg', elementProperty: 'borderColor', override: combineRgb(255, 165, 0) },
										{ elementId: 'bg', elementProperty: 'borderWidth', override: 2 },
									],
								},
							],
							steps: [],
						},
						// Simple fallback
						{
							type: 'simple',
							name: `CH${channel} VU Meter [${deviceHost}]`,
							style: {
								text: `CH${channel}\\nV:${varVrms}\\nI:${varIrms}`,
								size: 'auto',
								color: combineRgb(255, 255, 255),
								bgcolor: combineRgb(20, 20, 20),
							},
							steps: [],
							feedbacks: [
								{
									feedbackId: 'channelProtection',
									options: { device: deviceHost, channel: channel },
									style: {
										bgcolor: combineRgb(200, 0, 0),
										color: combineRgb(255, 255, 255),
									},
								},
							],
						},
					],
				},

				[`monitor_ch${channel}${suffix}`]: {
					type: 'alternatives',
					variants: [
						{
							type: 'layered',
							name: `CH${channel} Monitor [${deviceHost}]`,
							elements: [
								{
									id: 'bg',
									type: 'box',
									x: 0,
									y: 0,
									width: 100,
									height: 100,
									color: combineRgb(20, 20, 20),
									borderWidth: 0,
								},
								{
									id: 'title',
									type: 'text',
									x: 0,
									y: 0,
									width: 100,
									height: 20,
									text: `CH${channel}`,
									fontsize: 58,
									fontsizeAllowShrink: true,
									color: combineRgb(255, 255, 255),
									halign: 'center',
									valign: 'center',
									weight: 'bold',
								},
								{
									id: 'info',
									type: 'text',
									x: 2,
									y: 20,
									width: 96,
									height: 78,
									text: `V: ${varVrms}V\nI: ${varIrms}A\nHR: ${varHeadroom}`,
									fontsize: 25,
									fontsizeAllowShrink: true,
									color: combineRgb(200, 200, 200),
									halign: 'center',
									valign: 'top',
								},
							],
							feedbacks: [
								{
									feedbackId: 'channelProtection',
									options: { device: deviceHost, channel: channel },
									styleOverrides: [
										{ elementId: 'bg', elementProperty: 'borderColor', override: combineRgb(255, 0, 0) },
										{ elementId: 'bg', elementProperty: 'borderWidth', override: 3 },
									],
								},
								{
									feedbackId: 'channelProtectionThermal',
									options: { device: deviceHost, channel: channel },
									styleOverrides: [
										{ elementId: 'bg', elementProperty: 'borderColor', override: combineRgb(255, 165, 0) },
										{ elementId: 'bg', elementProperty: 'borderWidth', override: 2 },
									],
								},
								{
									feedbackId: 'channelGainReduction',
									options: { device: deviceHost, channel: channel, threshold: 0.95 },
									styleOverrides: [{ elementId: 'title', elementProperty: 'color', override: combineRgb(255, 165, 0) }],
								},
							],
							steps: [],
						},
						{
							type: 'simple',
							name: `CH${channel} Monitor [${deviceHost}]`,
							style: {
								text: `CH${channel}\\nV:${varVrms}V\\nI:${varIrms}A\\nHR:${varHeadroom}`,
								size: 'auto',
								color: combineRgb(255, 255, 255),
								bgcolor: combineRgb(20, 20, 20),
							},
							steps: [],
							feedbacks: [
								{
									feedbackId: 'channelProtection',
									options: { device: deviceHost, channel: channel },
									style: {
										bgcolor: combineRgb(200, 0, 0),
										color: combineRgb(255, 255, 255),
									},
								},
								{
									feedbackId: 'channelProtectionThermal',
									options: { device: deviceHost, channel: channel },
									style: {
										bgcolor: combineRgb(255, 165, 0),
										color: combineRgb(0, 0, 0),
									},
								},
							],
						},
					],
				},
			}
		}

		// Helper: create device-level monitoring preset for a specific device
		const createDeviceMonitorPreset = (deviceHost: string): CompanionPresetDefinitions => {
			const devId = sanitizeDeviceId(deviceHost)
			const suffix = wsHosts.length > 1 ? `_${devId}` : ''

			return {
				[`device_monitor${suffix}`]: {
					type: 'alternatives',
					variants: [
						{
							type: 'layered',
							name: `Device Monitor [${deviceHost}]`,
							elements: [
								{
									id: 'bg',
									type: 'box',
									x: 0,
									y: 0,
									width: 100,
									height: 100,
									color: combineRgb(20, 20, 20),
									borderWidth: 0,
								},
								{
									id: 'title',
									type: 'text',
									x: 0,
									y: 0,
									width: 100,
									height: 20,
									text: `$(Powersoft:name_${devId})`,
									fontsize: 58,
									fontsizeAllowShrink: true,
									color: combineRgb(255, 255, 255),
									halign: 'center',
									valign: 'center',
									weight: 'bold',
								},
								{
									id: 'info',
									type: 'text',
									x: 2,
									y: 20,
									width: 96,
									height: 78,
									text: `DSP: $(Powersoft:dsp_load_${devId})%\nFan: $(Powersoft:fan_${devId})%\nCPU: $(Powersoft:cpu_usage_${devId})%\nTemp: $(Powersoft:temp_mos_l_${devId})C`,
									fontsize: 25,
									fontsizeAllowShrink: true,
									color: combineRgb(200, 200, 200),
									halign: 'center',
									valign: 'top',
								},
							],
							feedbacks: [
								{
									feedbackId: 'deviceHwFault',
									options: { device: deviceHost },
									styleOverrides: [
										{ elementId: 'bg', elementProperty: 'borderColor', override: combineRgb(255, 0, 0) },
										{ elementId: 'bg', elementProperty: 'borderWidth', override: 3 },
									],
								},
								{
									feedbackId: 'deviceOverTempModerate',
									options: { device: deviceHost },
									styleOverrides: [
										{ elementId: 'bg', elementProperty: 'borderColor', override: combineRgb(255, 165, 0) },
										{ elementId: 'bg', elementProperty: 'borderWidth', override: 2 },
									],
								},
								{
									feedbackId: 'deviceStandby',
									options: { device: deviceHost },
									styleOverrides: [
										{ elementId: 'title', elementProperty: 'color', override: combineRgb(100, 100, 100) },
									],
								},
							],
							steps: [],
						},
						{
							type: 'simple',
							name: `Device Monitor [${deviceHost}]`,
							style: {
								text: `$(Powersoft:name_${devId})\\nDSP:$(Powersoft:dsp_load_${devId})%\\nFan:$(Powersoft:fan_${devId})%\\nTemp:$(Powersoft:temp_mos_l_${devId})C`,
								size: 'auto',
								color: combineRgb(255, 255, 255),
								bgcolor: combineRgb(20, 20, 20),
							},
							steps: [],
							feedbacks: [
								{
									feedbackId: 'deviceHwFault',
									options: { device: deviceHost },
									style: {
										bgcolor: combineRgb(200, 0, 0),
										color: combineRgb(255, 255, 255),
									},
								},
								{
									feedbackId: 'deviceOverTempModerate',
									options: { device: deviceHost },
									style: {
										bgcolor: combineRgb(255, 165, 0),
										color: combineRgb(0, 0, 0),
									},
								},
							],
						},
					],
				},
			}
		}

		// Generate monitoring presets for each device
		for (const deviceHost of wsHosts) {
			const devId = sanitizeDeviceId(deviceHost)
			const suffix = wsHosts.length > 1 ? `_${devId}` : ''

			// Device-level monitor preset
			Object.assign(monitoringPresets, createDeviceMonitorPreset(deviceHost))

			// Per-channel presets
			for (let i = 1; i <= maxChannels; i++) {
				Object.assign(monitoringPresets, createVuMeterPreset(i, deviceHost))
			}

			// Structure section per device (or single section if only one device)
			const sectionName = wsHosts.length > 1 ? `Monitoring [${deviceHost}]` : 'Monitoring (WebSocket)'
			monitoringStructure.push({
				id: `monitoring_${devId}`,
				name: sectionName,
				definitions: [
					{
						id: `device_monitor_${devId}`,
						type: 'simple',
						name: 'Device Monitor',
						presets: [`device_monitor${suffix}`],
					},
					...Array.from({ length: maxChannels }, (_, i) => {
						const ch = i + 1
						return {
							id: `ch${ch}_vu_${devId}`,
							type: 'simple' as const,
							name: `CH${ch} VU Meter`,
							presets: [`vu_meter_ch${ch}${suffix}`],
						}
					}),
					...Array.from({ length: maxChannels }, (_, i) => {
						const ch = i + 1
						return {
							id: `ch${ch}_monitor_${devId}`,
							type: 'simple' as const,
							name: `CH${ch} Monitor`,
							presets: [`monitor_ch${ch}${suffix}`],
						}
					}),
				],
			})
		}
	}

	// Combine all preset definitions
	const presets: CompanionPresetDefinitions = {
		...globalPresets,
		...channelPresets,
		...monitoringPresets,
	}

	// Build the structure that organises presets into sections/groups in the UI
	const structure: CompanionPresetSection[] = [
		{
			id: 'power',
			name: 'Power',
			definitions: [
				{ id: 'power_on', type: 'simple', name: 'Power On', presets: ['power_on'] },
				{ id: 'power_off', type: 'simple', name: 'Power Off', presets: ['power_off'] },
				{ id: 'power_toggle', type: 'simple', name: 'Power Toggle', presets: ['power_toggle'] },
			],
		},
		{
			id: 'maintenance',
			name: 'Maintenance',
			definitions: [
				{ id: 'reset_protection', type: 'simple', name: 'Reset Protection', presets: ['reset_protection'] },
				{ id: 'reset_peak_hold', type: 'simple', name: 'Reset Peak Hold', presets: ['reset_peak_hold'] },
			],
		},
		{
			id: 'mute',
			name: 'Mute',
			definitions: [
				{ id: 'mute_all', type: 'simple', name: 'Mute All Channels', presets: ['mute_all_channels'] },
				{ id: 'unmute_all', type: 'simple', name: 'Unmute All Channels', presets: ['unmute_all_channels'] },
			],
		},
		{
			id: 'diagnostics',
			name: 'Diagnostics',
			definitions: [
				{
					id: 'stop_all_diag',
					type: 'simple',
					name: 'Stop All Diagnostics (All CH)',
					presets: ['stop_all_diagnostics_all'],
				},
			],
		},
		// Per-channel groups
		...Array.from({ length: maxChannels }, (_, i) => {
			const ch = i + 1
			const channelName = `CH${ch}`
			const channelPresetIds = Object.keys(createChannelPresets(ch))
			return {
				id: `channel_${ch}`,
				name: channelName,
				definitions: [
					{
						id: `${channelName}_mute`,
						type: 'simple' as const,
						name: 'Mute',
						presets: channelPresetIds.filter((p) => p.startsWith('mute_toggle')),
					},
					{
						id: `${channelName}_gain`,
						type: 'simple' as const,
						name: 'Gain',
						presets: channelPresetIds.filter((p) => p.startsWith('gain_')),
					},
					{
						id: `${channelName}_status`,
						type: 'simple' as const,
						name: 'Status',
						presets: channelPresetIds.filter((p) => p.startsWith('clip_indicator')),
					},
					{
						id: `${channelName}_diagnostics`,
						type: 'simple' as const,
						name: 'Diagnostics',
						presets: channelPresetIds.filter((p) => p.startsWith('diag_')),
					},
				],
			}
		}),
		...monitoringStructure,
	]

	return { structure, presets }
}
