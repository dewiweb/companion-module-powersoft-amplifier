/**
 * Real-time meter data structures for Powersoft amplifiers.
 *
 * These are populated from the WebSocket `status-update` messages
 * and stored per-device in `deviceStatusById[id].meters`.
 */

export interface ChannelMeters {
	// Fast meters (from output_process[])
	vPostPeak: number // Volts
	vPostRms: number // Volts
	iPostPeak: number // Amps
	iPostRms: number // Amps
	headroom: number
	signalPresence: number

	// Gain reductions (1 = no reduction, <1 = active limiting)
	gainReductionTotal: number
	gainReductionClip: number
	gainReductionThermal: number
	gainReductionVoltagePeak: number
	gainReductionVoltageRms: number
	gainReductionCurrentRms: number
	gainReductionCurrentClamp: number
	gainReductionPower: number

	// Slow meters (from ext_state.output_channels[])
	protection: boolean
	protectionThermalLimiting: boolean
	protectionUnrecoverable: boolean
	loadMonitor: boolean
	loadDetect: boolean
	pilotToneVoltage: boolean

	// Slow meters (from output_process[] in slows)
	pilotToneDetected: boolean
	pilotToneValidity: boolean
	nominalImpedanceValidity: boolean
	detectedNominalImpedance: boolean
	detectionNominalImpedanceRms: number
	pilotToneDetectionImpedanceRms: number
}

export interface DeviceMeters {
	// Fast meters
	channels: ChannelMeters[]
	dspLoadAvg: number
	dspLoadPeak: number

	// Slow meters - device level
	fan: number
	powerSupply: number
	mains: number
	standby: number
	genericHwFault: number
	moderateOverTemperature: number
	highOverTemperature: number

	// Slow meters - temperatures
	tempDigiUp: number
	tempDigiDdr: number
	tempAdlinkUp: number
	tempMosLeft: number
	tempMosRight: number
	tempTrasf: number
	tempTrasfPfc: number

	// Slow meters - ampli modules (pairs of channels)
	ampliTemps: Array<{ tempChAPeak: number; tempChBPeak: number }>

	// Slow meters - system
	cpuUsage: number
	memoryUsage: number
	diskUsage: number

	// Slow meters - mains
	mainsNPhases: number
	vMainsPeak: number
	vMainsRms: number
	iMainsPeak: number
	iMainsRms: number
	activePowerPeak: number
}

export function createDefaultChannelMeters(): ChannelMeters {
	return {
		vPostPeak: 0,
		vPostRms: 0,
		iPostPeak: 0,
		iPostRms: 0,
		headroom: 0,
		signalPresence: 0,
		gainReductionTotal: 1,
		gainReductionClip: 1,
		gainReductionThermal: 1,
		gainReductionVoltagePeak: 1,
		gainReductionVoltageRms: 1,
		gainReductionCurrentRms: 1,
		gainReductionCurrentClamp: 1,
		gainReductionPower: 1,
		protection: false,
		protectionThermalLimiting: false,
		protectionUnrecoverable: false,
		loadMonitor: false,
		loadDetect: false,
		pilotToneVoltage: false,
		pilotToneDetected: false,
		pilotToneValidity: false,
		nominalImpedanceValidity: false,
		detectedNominalImpedance: false,
		detectionNominalImpedanceRms: 0,
		pilotToneDetectionImpedanceRms: 0,
	}
}

export function createDefaultDeviceMeters(maxChannels: number): DeviceMeters {
	return {
		channels: Array.from({ length: maxChannels }, () => createDefaultChannelMeters()),
		dspLoadAvg: 0,
		dspLoadPeak: 0,
		fan: 0,
		powerSupply: 0,
		mains: 0,
		standby: 0,
		genericHwFault: 0,
		moderateOverTemperature: 0,
		highOverTemperature: 0,
		tempDigiUp: 0,
		tempDigiDdr: 0,
		tempAdlinkUp: 0,
		tempMosLeft: 0,
		tempMosRight: 0,
		tempTrasf: 0,
		tempTrasfPfc: 0,
		ampliTemps: [],
		cpuUsage: 0,
		memoryUsage: 0,
		diskUsage: 0,
		mainsNPhases: 0,
		vMainsPeak: 0,
		vMainsRms: 0,
		iMainsPeak: 0,
		iMainsRms: 0,
		activePowerPeak: 0,
	}
}

/**
 * Merge WebSocket meter data into a DeviceMeters structure.
 * Only updates fields that are present in the incoming data.
 */
export function mergeMeters(meters: DeviceMeters, maxChannels: number, data: { fast?: any; slow?: any }): boolean {
	let changed = false

	// --- Fast meters ---
	if (data.fast) {
		const f = data.fast
		if (f.dsp_tskmgr) {
			if (typeof f.dsp_tskmgr.dsp_load_avg === 'number') {
				meters.dspLoadAvg = f.dsp_tskmgr.dsp_load_avg
				changed = true
			}
			if (typeof f.dsp_tskmgr.dsp_load_peak === 'number') {
				meters.dspLoadPeak = f.dsp_tskmgr.dsp_load_peak
				changed = true
			}
		}
		if (Array.isArray(f.output_process)) {
			for (let i = 0; i < Math.min(f.output_process.length, maxChannels); i++) {
				const op = f.output_process[i]
				if (!op) continue
				const ch = meters.channels[i]
				if (typeof op.meter_v_post_peak === 'number') {
					ch.vPostPeak = op.meter_v_post_peak
					changed = true
				}
				if (typeof op.meter_v_post_rms === 'number') {
					ch.vPostRms = op.meter_v_post_rms
					changed = true
				}
				if (typeof op.meter_i_post_peak === 'number') {
					ch.iPostPeak = op.meter_i_post_peak
					changed = true
				}
				if (typeof op.meter_i_post_rms === 'number') {
					ch.iPostRms = op.meter_i_post_rms
					changed = true
				}
				if (typeof op.meter_headroom === 'number') {
					ch.headroom = op.meter_headroom
					changed = true
				}
				if (typeof op.signal_presence === 'number') {
					ch.signalPresence = op.signal_presence
					changed = true
				}
				if (typeof op.user_gain_reduction_total === 'number') {
					ch.gainReductionTotal = op.user_gain_reduction_total
					changed = true
				}
				if (typeof op.user_gain_reduction_clip_limiter === 'number') {
					ch.gainReductionClip = op.user_gain_reduction_clip_limiter
					changed = true
				}
				if (typeof op.user_gain_reduction_thermal_limiter === 'number') {
					ch.gainReductionThermal = op.user_gain_reduction_thermal_limiter
					changed = true
				}
				if (typeof op.user_gain_reduction_voltage_peak_limiter === 'number') {
					ch.gainReductionVoltagePeak = op.user_gain_reduction_voltage_peak_limiter
					changed = true
				}
				if (typeof op.user_gain_reduction_voltage_rms_limiter === 'number') {
					ch.gainReductionVoltageRms = op.user_gain_reduction_voltage_rms_limiter
					changed = true
				}
				if (typeof op.user_gain_reduction_current_rms_limiter === 'number') {
					ch.gainReductionCurrentRms = op.user_gain_reduction_current_rms_limiter
					changed = true
				}
				if (typeof op.user_gain_reduction_current_clamp_limiter === 'number') {
					ch.gainReductionCurrentClamp = op.user_gain_reduction_current_clamp_limiter
					changed = true
				}
				if (typeof op.user_gain_reduction_power_limiter === 'number') {
					ch.gainReductionPower = op.user_gain_reduction_power_limiter
					changed = true
				}
			}
		}
	}

	// --- Slow meters ---
	if (data.slow) {
		const s = data.slow
		if (s.ext_state) {
			const e = s.ext_state
			if (typeof e.fan === 'number') {
				meters.fan = e.fan
				changed = true
			}
			if (typeof e.power_supply === 'number') {
				meters.powerSupply = e.power_supply
				changed = true
			}
			if (typeof e.mains === 'number') {
				meters.mains = e.mains
				changed = true
			}
			if (typeof e.standby === 'number') {
				meters.standby = e.standby
				changed = true
			}
			if (typeof e.generic_hw_fault === 'number') {
				meters.genericHwFault = e.generic_hw_fault
				changed = true
			}
			if (typeof e.moderate_over_temperature === 'number') {
				meters.moderateOverTemperature = e.moderate_over_temperature
				changed = true
			}
			if (typeof e.high_over_temperature === 'number') {
				meters.highOverTemperature = e.high_over_temperature
				changed = true
			}
			if (Array.isArray(e.output_channels)) {
				for (let i = 0; i < Math.min(e.output_channels.length, maxChannels); i++) {
					const oc = e.output_channels[i]
					if (!oc) continue
					const ch = meters.channels[i]
					if (typeof oc.protection === 'boolean') {
						ch.protection = oc.protection
						changed = true
					}
					if (typeof oc.protection_thermal_limiting === 'boolean') {
						ch.protectionThermalLimiting = oc.protection_thermal_limiting
						changed = true
					}
					if (typeof oc.protection_unrecoverable === 'boolean') {
						ch.protectionUnrecoverable = oc.protection_unrecoverable
						changed = true
					}
					if (typeof oc.load_monitor === 'boolean') {
						ch.loadMonitor = oc.load_monitor
						changed = true
					}
					if (typeof oc.load_detect === 'boolean') {
						ch.loadDetect = oc.load_detect
						changed = true
					}
					if (typeof oc.pilot_tone_voltage === 'boolean') {
						ch.pilotToneVoltage = oc.pilot_tone_voltage
						changed = true
					}
				}
			}
		}
		if (s.arm_info_slow) {
			if (typeof s.arm_info_slow.cpu_usage === 'number') {
				meters.cpuUsage = s.arm_info_slow.cpu_usage
				changed = true
			}
			if (typeof s.arm_info_slow.memory_usage === 'number') {
				meters.memoryUsage = s.arm_info_slow.memory_usage
				changed = true
			}
			if (typeof s.arm_info_slow.disk_usage === 'number') {
				meters.diskUsage = s.arm_info_slow.disk_usage
				changed = true
			}
		}
		if (s.digi) {
			if (typeof s.digi.temp_up_peak === 'number') {
				meters.tempDigiUp = s.digi.temp_up_peak
				changed = true
			}
			if (typeof s.digi.temp_ddr_peak === 'number') {
				meters.tempDigiDdr = s.digi.temp_ddr_peak
				changed = true
			}
		}
		if (s.adlink) {
			if (typeof s.adlink.temp_up_peak === 'number') {
				meters.tempAdlinkUp = s.adlink.temp_up_peak
				changed = true
			}
		}
		if (s.ali) {
			if (typeof s.ali.mains_n_phases === 'number') {
				meters.mainsNPhases = s.ali.mains_n_phases
				changed = true
			}
			if (typeof s.ali.v_mains_peak === 'number') {
				meters.vMainsPeak = s.ali.v_mains_peak
				changed = true
			}
			if (typeof s.ali.v_mains_rms === 'number') {
				meters.vMainsRms = s.ali.v_mains_rms
				changed = true
			}
			if (typeof s.ali.i_mains_peak === 'number') {
				meters.iMainsPeak = s.ali.i_mains_peak
				changed = true
			}
			if (typeof s.ali.i_mains_rms === 'number') {
				meters.iMainsRms = s.ali.i_mains_rms
				changed = true
			}
			if (typeof s.ali.active_power_peak === 'number') {
				meters.activePowerPeak = s.ali.active_power_peak
				changed = true
			}
			if (typeof s.ali.temp_mos_left_peak === 'number') {
				meters.tempMosLeft = s.ali.temp_mos_left_peak
				changed = true
			}
			if (typeof s.ali.temp_mos_right_peak === 'number') {
				meters.tempMosRight = s.ali.temp_mos_right_peak
				changed = true
			}
			if (typeof s.ali.temp_trasf_peak === 'number') {
				meters.tempTrasf = s.ali.temp_trasf_peak
				changed = true
			}
			if (typeof s.ali.temp_trasf_pfc_peak === 'number') {
				meters.tempTrasfPfc = s.ali.temp_trasf_pfc_peak
				changed = true
			}
		}
		if (Array.isArray(s.ampli)) {
			meters.ampliTemps = s.ampli.map((a: any) => ({
				tempChAPeak: typeof a.temp_ch_a_peak === 'number' ? a.temp_ch_a_peak : 0,
				tempChBPeak: typeof a.temp_ch_b_peak === 'number' ? a.temp_ch_b_peak : 0,
			}))
			changed = true
		}
		if (Array.isArray(s.output_process)) {
			for (let i = 0; i < Math.min(s.output_process.length, maxChannels); i++) {
				const op = s.output_process[i]
				if (!op) continue
				const ch = meters.channels[i]
				if (typeof op.pilot_tone_detected === 'boolean') {
					ch.pilotToneDetected = op.pilot_tone_detected
					changed = true
				}
				if (typeof op.pilot_tone_validity === 'boolean') {
					ch.pilotToneValidity = op.pilot_tone_validity
					changed = true
				}
				if (typeof op.nominal_impedance_validity === 'boolean') {
					ch.nominalImpedanceValidity = op.nominal_impedance_validity
					changed = true
				}
				if (typeof op.detected_nominal_impedence === 'boolean') {
					ch.detectedNominalImpedance = op.detected_nominal_impedence
					changed = true
				}
				if (typeof op.detection_nominal_impedence_rms === 'number') {
					ch.detectionNominalImpedanceRms = op.detection_nominal_impedence_rms
					changed = true
				}
				if (typeof op.pilot_tone_detection_impedence_rms === 'number') {
					ch.pilotToneDetectionImpedanceRms = op.pilot_tone_detection_impedence_rms
					changed = true
				}
			}
		}
	}

	return changed
}
