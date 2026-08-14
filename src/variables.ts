import type ModuleInstance from './main.js'
import { listDevices, sanitizeDeviceId } from './devices.js'

// Formatting helpers
const fmtDb = (v?: number): string => (typeof v === 'number' && isFinite(v) ? v.toFixed(1) : '0.0')
const fmtTemp = (v?: number): string => (typeof v === 'number' && isFinite(v) ? v.toFixed(1) : '0.0')
const fmtImp = (v?: number): string => (typeof v === 'number' && isFinite(v) ? v.toFixed(2) : '0.00')
const fmtPct = (v?: number): string => (typeof v === 'number' && isFinite(v) ? v.toFixed(0) : '0')
const fmtVal = (v: number | undefined, digits: number): string =>
	typeof v === 'number' && isFinite(v) ? v.toFixed(digits) : digits === 0 ? '0' : (0).toFixed(digits)

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const chCount = self.config.maxChannels
	const hosts = listDevices(self.config)
	const udpEnabled = Boolean(self.config.enableUdpFeedback)
	const wsEnabled = Boolean(self.config.enableWebSocketMeters)

	const defs: Record<string, { name: string }> = {}

	const addDeviceDefs = (id: string, label: string) => {
		defs[`name_${id}`] = { name: `Device Name [${label}]` }
		defs[`firmware_${id}`] = { name: `Firmware Version [${label}]` }
		defs[`ip_${id}`] = { name: `IP Address [${label}]` }
		defs[`power_${id}`] = { name: `Power State [${label}]` }
		defs[`connected_${id}`] = { name: `Connection State [${label}]` }
		defs[`temperature_${id}`] = { name: `Device Temperature (°C) [${label}]` }
		defs[`fanSpeed_${id}`] = { name: `Fan Speed (%) [${label}]` }
		defs[`error_${id}`] = { name: `Error Message [${label}]` }
		for (let i = 0; i < chCount; i++) {
			const ch = i + 1
			defs[`ch${ch}_name_${id}`] = { name: `Ch ${ch} Name [${label}]` }
			defs[`ch${ch}_mute_${id}`] = { name: `Ch ${ch} Mute [${label}]` }
			defs[`ch${ch}_gain_${id}`] = { name: `Ch ${ch} Gain (dB) [${label}]` }
			defs[`ch${ch}_limiter_threshold_${id}`] = { name: `Ch ${ch} Limiter Threshold (dB) [${label}]` }
			defs[`ch${ch}_clip_${id}`] = { name: `Ch ${ch} Clip [${label}]` }
			defs[`ch${ch}_signal_${id}`] = { name: `Ch ${ch} Signal Present [${label}]` }
			defs[`ch${ch}_temp_${id}`] = { name: `Ch ${ch} Temperature (°C) [${label}]` }
			defs[`ch${ch}_impedance_${id}`] = { name: `Ch ${ch} Load Impedance (Ω) [${label}]` }
			defs[`sp${ch}_model_${id}`] = { name: `Speaker ${ch} Model [${label}]` }
			// UDP-specific per-channel alarm variables are only exposed when UDP feedback is enabled
			if (udpEnabled) {
				defs[`ch${ch}_overtemp_${id}`] = { name: `Ch ${ch} Over-Temperature [${label}]` }
				defs[`ch${ch}_lowload_${id}`] = { name: `Ch ${ch} Low Load Protection [${label}]` }
				defs[`ch${ch}_rail_fault_${id}`] = { name: `Ch ${ch} Rail Voltage Fault [${label}]` }
				defs[`ch${ch}_other_fault_${id}`] = { name: `Ch ${ch} Other Fault [${label}]` }
				defs[`ch${ch}_thermal_soa_${id}`] = { name: `Ch ${ch} Thermal SOA [${label}]` }
				defs[`ch${ch}_aux_current_fault_${id}`] = { name: `Ch ${ch} AUX Current Fault [${label}]` }
			}
			// WebSocket real-time meter variables
			if (wsEnabled) {
				defs[`ch${ch}_v_peak_${id}`] = { name: `Ch ${ch} V Post Peak (V) [${label}]` }
				defs[`ch${ch}_v_rms_${id}`] = { name: `Ch ${ch} V Post RMS (V) [${label}]` }
				defs[`ch${ch}_i_peak_${id}`] = { name: `Ch ${ch} I Post Peak (A) [${label}]` }
				defs[`ch${ch}_i_rms_${id}`] = { name: `Ch ${ch} I Post RMS (A) [${label}]` }
				defs[`ch${ch}_headroom_${id}`] = { name: `Ch ${ch} Headroom [${label}]` }
				defs[`ch${ch}_gr_total_${id}`] = { name: `Ch ${ch} Gain Reduction Total [${label}]` }
				defs[`ch${ch}_gr_db_${id}`] = { name: `Ch ${ch} Gain Reduction (dB) [${label}]` }
				defs[`ch${ch}_protection_${id}`] = { name: `Ch ${ch} Protection [${label}]` }
				defs[`ch${ch}_prot_thermal_${id}`] = { name: `Ch ${ch} Protection Thermal Limiting [${label}]` }
				defs[`ch${ch}_prot_unrecoverable_${id}`] = { name: `Ch ${ch} Protection Unrecoverable [${label}]` }
				defs[`ch${ch}_load_monitor_${id}`] = { name: `Ch ${ch} Load Monitor [${label}]` }
				defs[`ch${ch}_load_detect_${id}`] = { name: `Ch ${ch} Load Detect [${label}]` }
				defs[`ch${ch}_pilot_voltage_${id}`] = { name: `Ch ${ch} Pilot Tone Voltage [${label}]` }
				defs[`ch${ch}_impedance_rms_${id}`] = { name: `Ch ${ch} Detected Impedance RMS (Ω) [${label}]` }
			}
		}
		// WebSocket device-level meter variables
		if (wsEnabled) {
			defs[`dsp_load_${id}`] = { name: `DSP Load Avg (%) [${label}]` }
			defs[`dsp_load_peak_${id}`] = { name: `DSP Load Peak (%) [${label}]` }
			defs[`fan_${id}`] = { name: `Fan Status [${label}]` }
			defs[`standby_ws_${id}`] = { name: `Standby (WS) [${label}]` }
			defs[`hw_fault_${id}`] = { name: `Hardware Fault [${label}]` }
			defs[`over_temp_mod_${id}`] = { name: `Moderate Over-Temperature [${label}]` }
			defs[`over_temp_high_${id}`] = { name: `High Over-Temperature [${label}]` }
			defs[`temp_digi_${id}`] = { name: `Temp Digi Up (°C) [${label}]` }
			defs[`temp_adlink_${id}`] = { name: `Temp Adlink Up (°C) [${label}]` }
			defs[`temp_mos_l_${id}`] = { name: `Temp MOS Left (°C) [${label}]` }
			defs[`temp_mos_r_${id}`] = { name: `Temp MOS Right (°C) [${label}]` }
			defs[`cpu_usage_${id}`] = { name: `CPU Usage (%) [${label}]` }
			defs[`mem_usage_${id}`] = { name: `Memory Usage (%) [${label}]` }
			defs[`disk_usage_${id}`] = { name: `Disk Usage (%) [${label}]` }
			// Ampli module temperatures (pairs of channels)
			const moduleCount = Math.ceil(chCount / 2)
			for (let m = 0; m < moduleCount; m++) {
				defs[`temp_mod${m + 1}_a_${id}`] = { name: `Temp Module ${m + 1} A (°C) [${label}]` }
				defs[`temp_mod${m + 1}_b_${id}`] = { name: `Temp Module ${m + 1} B (°C) [${label}]` }
			}
		}
	}

	if (hosts.length > 0) {
		for (const host of hosts) addDeviceDefs(sanitizeDeviceId(host), host)
	} else if (self.config.host) {
		addDeviceDefs(sanitizeDeviceId(self.config.host), self.config.host)
	}

	self.setVariableDefinitions(defs)
}

export function UpdateVariables(self: ModuleInstance): void {
	const variables: Record<string, string> = {}
	const hosts = listDevices(self.config)
	const chCount = self.config.maxChannels
	const udpEnabled = Boolean(self.config.enableUdpFeedback)
	const wsEnabled = Boolean(self.config.enableWebSocketMeters)

	const writeDeviceVars = (id: string, label: string, status: any) => {
		variables[`name_${id}`] = status.name || label
		variables[`firmware_${id}`] = status.firmware || '0.0.0'
		variables[`ip_${id}`] = status.ip || label
		variables[`power_${id}`] = status.power ? 'On' : 'Off'
		variables[`connected_${id}`] = status.connected === false ? 'Disconnected' : 'Connected'
		variables[`temperature_${id}`] = fmtTemp(status.temp)
		variables[`fanSpeed_${id}`] = fmtPct(status.fanSpeed)
		variables[`error_${id}`] = status.error || 'None'
		for (let i = 0; i < chCount; i++) {
			const ch = i + 1
			const channel = status.channels?.[i] || {}
			variables[`ch${ch}_name_${id}`] = channel.name || `CH${ch}`
			variables[`ch${ch}_mute_${id}`] = channel.mute ? 'Muted' : 'Unmuted'
			variables[`ch${ch}_gain_${id}`] = fmtDb(channel.gain)
			variables[`ch${ch}_limiter_threshold_${id}`] =
				channel.limiterThreshold !== undefined && channel.limiterThreshold !== null
					? fmtDb(Number(channel.limiterThreshold))
					: 'n/a'
			variables[`ch${ch}_clip_${id}`] = channel.clip ? 'Clipping' : 'OK'
			variables[`ch${ch}_signal_${id}`] = channel.signalPresent ? 'Yes' : 'No'
			variables[`ch${ch}_temp_${id}`] = fmtTemp(channel.temp)
			variables[`ch${ch}_impedance_${id}`] = fmtImp(channel.loadImpedance)
			const speaker = status.speakers?.[i] || {}
			variables[`sp${ch}_model_${id}`] = speaker.modelName || 'Unknown'
			// Only set UDP alarm variables when UDP feedback is enabled
			if (udpEnabled) {
				variables[`ch${ch}_overtemp_${id}`] = channel.overTemp ? 'Yes' : 'No'
				variables[`ch${ch}_lowload_${id}`] = channel.lowLoad ? 'Yes' : 'No'
				variables[`ch${ch}_rail_fault_${id}`] = channel.railFault ? 'Yes' : 'No'
				variables[`ch${ch}_other_fault_${id}`] = channel.otherFault ? 'Yes' : 'No'
				variables[`ch${ch}_thermal_soa_${id}`] = channel.thermalSOA ? 'Yes' : 'No'
				variables[`ch${ch}_aux_current_fault_${id}`] = channel.auxCurrentFault ? 'Yes' : 'No'
			}
			// WebSocket real-time meter variables
			if (wsEnabled) {
				const m = status.meters?.channels?.[i]
				if (m) {
					variables[`ch${ch}_v_peak_${id}`] = fmtVal(m.vPostPeak, 3)
					variables[`ch${ch}_v_rms_${id}`] = fmtVal(m.vPostRms, 3)
					variables[`ch${ch}_i_peak_${id}`] = fmtVal(m.iPostPeak, 3)
					variables[`ch${ch}_i_rms_${id}`] = fmtVal(m.iPostRms, 3)
					variables[`ch${ch}_headroom_${id}`] = fmtVal(m.headroom, 0)
					variables[`ch${ch}_gr_total_${id}`] = fmtVal(m.gainReductionTotal, 3)
					// Gain reduction in dB: 20*log10(gr) where gr is 0..1
					const grDb = m.gainReductionTotal > 0 && m.gainReductionTotal <= 1 ? 20 * Math.log10(m.gainReductionTotal) : 0
					variables[`ch${ch}_gr_db_${id}`] = fmtDb(grDb)
					variables[`ch${ch}_protection_${id}`] = m.protection ? 'Yes' : 'No'
					variables[`ch${ch}_prot_thermal_${id}`] = m.protectionThermalLimiting ? 'Yes' : 'No'
					variables[`ch${ch}_prot_unrecoverable_${id}`] = m.protectionUnrecoverable ? 'Yes' : 'No'
					variables[`ch${ch}_load_monitor_${id}`] = m.loadMonitor ? 'Yes' : 'No'
					variables[`ch${ch}_load_detect_${id}`] = m.loadDetect ? 'Yes' : 'No'
					variables[`ch${ch}_pilot_voltage_${id}`] = m.pilotToneVoltage ? 'Yes' : 'No'
					variables[`ch${ch}_impedance_rms_${id}`] = fmtImp(m.detectionNominalImpedanceRms)
				} else {
					variables[`ch${ch}_v_peak_${id}`] = '0.000'
					variables[`ch${ch}_v_rms_${id}`] = '0.000'
					variables[`ch${ch}_i_peak_${id}`] = '0.000'
					variables[`ch${ch}_i_rms_${id}`] = '0.000'
					variables[`ch${ch}_headroom_${id}`] = '0'
					variables[`ch${ch}_gr_total_${id}`] = '1.000'
					variables[`ch${ch}_gr_db_${id}`] = '0.0'
					variables[`ch${ch}_protection_${id}`] = 'No'
					variables[`ch${ch}_prot_thermal_${id}`] = 'No'
					variables[`ch${ch}_prot_unrecoverable_${id}`] = 'No'
					variables[`ch${ch}_load_monitor_${id}`] = 'No'
					variables[`ch${ch}_load_detect_${id}`] = 'No'
					variables[`ch${ch}_pilot_voltage_${id}`] = 'No'
					variables[`ch${ch}_impedance_rms_${id}`] = '0.00'
				}
			}
		}
		// WebSocket device-level meter variables
		if (wsEnabled) {
			const m = status.meters
			if (m) {
				variables[`dsp_load_${id}`] = fmtPct(m.dspLoadAvg)
				variables[`dsp_load_peak_${id}`] = fmtPct(m.dspLoadPeak)
				variables[`fan_${id}`] = fmtPct(m.fan)
				variables[`standby_ws_${id}`] = m.standby ? 'Standby' : 'Active'
				variables[`hw_fault_${id}`] = m.genericHwFault ? 'Yes' : 'No'
				variables[`over_temp_mod_${id}`] = m.moderateOverTemperature ? 'Yes' : 'No'
				variables[`over_temp_high_${id}`] = m.highOverTemperature ? 'Yes' : 'No'
				variables[`temp_digi_${id}`] = fmtTemp(m.tempDigiUp)
				variables[`temp_adlink_${id}`] = fmtTemp(m.tempAdlinkUp)
				variables[`temp_mos_l_${id}`] = fmtTemp(m.tempMosLeft)
				variables[`temp_mos_r_${id}`] = fmtTemp(m.tempMosRight)
				variables[`cpu_usage_${id}`] = fmtPct(m.cpuUsage)
				variables[`mem_usage_${id}`] = fmtPct(m.memoryUsage)
				variables[`disk_usage_${id}`] = fmtPct(m.diskUsage)
				// Ampli module temperatures
				const moduleCount = Math.ceil(chCount / 2)
				for (let mi = 0; mi < moduleCount; mi++) {
					const mod = m.ampliTemps?.[mi]
					variables[`temp_mod${mi + 1}_a_${id}`] = mod ? fmtTemp(mod.tempChAPeak) : '0.0'
					variables[`temp_mod${mi + 1}_b_${id}`] = mod ? fmtTemp(mod.tempChBPeak) : '0.0'
				}
			}
		}
	}

	if (hosts.length > 0) {
		for (const host of hosts) {
			const id = sanitizeDeviceId(host)
			writeDeviceVars(id, host, self.deviceStatusById[id] || { channels: [] })
		}
	} else if (self.config.host) {
		const id = sanitizeDeviceId(self.config.host)
		writeDeviceVars(id, self.config.host, self.deviceStatusById[id] || self.deviceStatus || { channels: [] })
	}
	self.setVariableValues(variables)
}
