/**
 * WebSocket client for Powersoft UNICA amplifiers.
 *
 * Connects to the Socket.IO-compatible WebSocket endpoint and parses
 * `status-update` messages containing real-time meters (fast) and
 * slow diagnostics (temperature, fan, protection, etc.).
 *
 * This is a **read-only** client: it never sends commands to the amplifier.
 * The amplifier pushes meter data approximately once per second.
 */

import { WebSocket } from 'ws'

// --- Types matching the amplifier's WebSocket payload ---

export interface WsSourceSelectionMeter {
	selected_backup?: number
	signal_presence_active?: boolean
	signal_clipping_active?: boolean
	meter_peak_0?: number
	meter_peak_1?: number
	meter_peak_2?: number
	meter_peak_3?: number
	meter_rms_0?: number
	meter_rms_1?: number
	meter_rms_2?: number
	meter_rms_3?: number
	signal_clipping_0?: number
	signal_clipping_1?: number
	signal_clipping_2?: number
	signal_clipping_3?: number
	signal_presence_0?: number
	signal_presence_1?: number
	signal_presence_2?: number
	signal_presence_3?: number
}

export interface WsOutputProcessMeter {
	meter_v_post_peak?: number
	meter_v_post_rms?: number
	signal_presence?: number
	meter_i_post_peak?: number
	meter_i_post_rms?: number
	meter_headroom?: number
	soa_gain_reduction_current_clamp_limiter?: number
	user_gain_reduction_thermal_limiter?: number
	user_gain_reduction_clip_limiter?: number
	user_gain_reduction_voltage_peak_limiter?: number
	user_gain_reduction_voltage_rms_limiter?: number
	user_gain_reduction_current_rms_limiter?: number
	user_gain_reduction_current_clamp_limiter?: number
	user_gain_reduction_power_limiter?: number
	user_gain_reduction_total?: number
}

export interface WsDspTskmgr {
	dsp_load_avg?: number
	dsp_load_peak?: number
}

export interface WsFastMeters {
	source_selection?: WsSourceSelectionMeter[]
	output_process?: WsOutputProcessMeter[]
	dsp_tskmgr?: WsDspTskmgr
}

export interface WsExtState {
	fan?: number
	power_supply?: number
	mains?: number
	standby?: number
	generic_hw_fault?: number
	moderate_over_temperature?: number
	high_over_temperature?: number
	input_channels?: Array<{ pilot_tone_detect?: boolean }>
	output_channels?: Array<{
		pilot_tone_voltage?: boolean
		load_monitor?: boolean
		load_detect?: boolean
		protection?: boolean
		protection_thermal_limiting?: boolean
		protection_unrecoverable?: boolean
	}>
}

export interface WsArmInfoSlow {
	cpu_usage?: number
	memory_usage?: number
	memory_free_mb?: number
	disk_usage?: number
	disk_free_mb?: number
}

export interface WsAmpliTemp {
	temp_ch_a_peak?: number
	temp_ch_b_peak?: number
}

export interface WsSlowMeters {
	internal_player_running?: boolean
	ext_state?: WsExtState
	arm_info_slow?: WsArmInfoSlow
	ext_alarm_slow?: { ext_alarm_all?: number[] }
	adlink?: { temp_up_peak?: number }
	digi?: { temp_up_peak?: number; temp_ddr_peak?: number }
	ali?: {
		mains_n_phases?: number
		v_mains_peak?: number
		v_mains_rms?: number
		i_mains_peak?: number
		i_mains_rms?: number
		active_power_peak?: number
		temp_mos_left_peak?: number
		temp_mos_right_peak?: number
		temp_trasf_peak?: number
		temp_trasf_pfc_peak?: number
	}
	ampli?: WsAmpliTemp[]
	output_process?: Array<{
		pilot_tone_detection_rms?: number
		pilot_tone_detection_impedence_rms?: number
		dip_switch?: number
		pilot_tone_detected?: boolean
		pilot_tone_detected_impedence?: boolean
		pilot_tone_validity?: boolean
		pilot_tone_impedance_validity?: boolean
		detection_nominal_impedence_rms?: number
		detected_nominal_impedence?: boolean
		nominal_impedance_validity?: boolean
	}>
}

export interface WsMeters {
	fast?: WsFastMeters
	slow?: WsSlowMeters
}

// --- Client options ---

export interface WsClientOptions {
	host: string
	port?: number // default 80
	useHttps?: boolean // default false
	username?: string
	password?: string
	onMeters: (meters: WsMeters) => void
	onStatus?: (connected: boolean) => void
	log?: (level: 'info' | 'debug' | 'warn' | 'error', msg: string) => void
}

// --- Client class ---

export class PowersoftWsClient {
	private ws: WebSocket | null = null
	private reconnectTimer: NodeJS.Timeout | null = null
	private pingTimer: NodeJS.Timeout | null = null
	private destroyed = false
	private connected = false
	private readonly opts: Required<Omit<WsClientOptions, 'onMeters' | 'onStatus' | 'log'>> &
		Pick<WsClientOptions, 'onMeters' | 'onStatus' | 'log'>

	constructor(opts: WsClientOptions) {
		this.opts = {
			host: opts.host,
			port: opts.port ?? 80,
			useHttps: opts.useHttps ?? false,
			username: opts.username ?? 'powersoft',
			password: opts.password ?? 'powersoft',
			onMeters: opts.onMeters,
			onStatus: opts.onStatus,
			log: opts.log,
		}
	}

	private get url(): string {
		const scheme = this.opts.useHttps ? 'wss' : 'ws'
		return `${scheme}://${this.opts.host}:${this.opts.port}/socket.io/?EIO=4&transport=websocket`
	}

	private get authHeader(): string {
		return 'Basic ' + Buffer.from(`${this.opts.username}:${this.opts.password}`).toString('base64')
	}

	connect(): void {
		if (this.destroyed) return
		this.opts.log?.('debug', `WS connecting to ${this.url}`)

		try {
			this.ws = new WebSocket(this.url, {
				headers: { Authorization: this.authHeader },
				rejectUnauthorized: false,
			})
		} catch (e: any) {
			this.opts.log?.('error', `WS create error: ${e?.message || e}`)
			this.scheduleReconnect()
			return
		}

		this.ws.on('open', () => {
			this.connected = true
			this.opts.onStatus?.(true)
			this.opts.log?.('debug', `WS connected to ${this.opts.host}`)
			// Socket.IO v4 upgrade handshake
			try {
				this.ws?.send('40')
			} catch {
				// ignore
			}
			// Send periodic ping to keep connection alive
			this.pingTimer = setInterval(() => {
				try {
					this.ws?.send('2')
				} catch {
					// ignore
				}
			}, 20000)
		})

		this.ws.on('message', (data: { toString: () => string }) => {
			const str = data.toString()
			if (!str.startsWith('42[')) return

			try {
				const json = JSON.parse(str.substring(2))
				if (json[0] === 'status-update') {
					const readings = json[1]?.payload?.readings
					if (readings) {
						const meters: WsMeters = {}
						if (readings.meters) meters.fast = readings.meters as WsFastMeters
						if (readings.slows) meters.slow = readings.slows as WsSlowMeters
						if (meters.fast || meters.slow) {
							this.opts.onMeters(meters)
						}
					}
				}
			} catch {
				// ignore parse errors
			}
		})

		this.ws.on('error', (err: Error) => {
			this.opts.log?.('warn', `WS error [${this.opts.host}]: ${err.message}`)
		})

		this.ws.on('close', (code: number, reason: Buffer) => {
			this.cleanupSocket()
			if (this.connected) {
				this.connected = false
				this.opts.onStatus?.(false)
				this.opts.log?.('debug', `WS disconnected [${this.opts.host}] code=${code} reason=${reason.toString()}`)
			}
			this.scheduleReconnect()
		})
	}

	private cleanupSocket(): void {
		if (this.pingTimer) {
			clearInterval(this.pingTimer)
			this.pingTimer = null
		}
	}

	private scheduleReconnect(): void {
		if (this.destroyed) return
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null
			this.connect()
		}, 5000)
	}

	disconnect(): void {
		this.destroyed = true
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
		this.cleanupSocket()
		if (this.ws) {
			try {
				this.ws.removeAllListeners()
				this.ws.close()
			} catch {
				// ignore
			}
			this.ws = null
		}
		this.connected = false
	}

	isConnected(): boolean {
		return this.connected
	}
}
