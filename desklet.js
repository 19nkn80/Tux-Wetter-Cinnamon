const St = imports.gi.St;
const Desklet = imports.ui.desklet;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const ModalDialog = imports.ui.modalDialog;
const Settings = imports.ui.settings;

const REPOSITORY = '19nkn80/Tux-Wetter-Cinnamon';
const RAW_BASE_URL = 'https://raw.githubusercontent.com/' + REPOSITORY + '/main/';
const LOCAL_VERSION = '1.1.1';

class TuxWetterDesklet extends Desklet.Desklet {
    constructor(metadata, desklet_id) {
        super(metadata, desklet_id);
        this.desklet_id = desklet_id;
        this.location = '52.52,13.405';
        this.locationName = 'Lüchow';
        this.updateInterval = 30;
        this.temperatureUnit = 'celsius';
        this.windUnit = 'kmh';
        this.showHumidity = true;
        this.showPrecipitation = true;
        this.showSunriseSunset = true;
        this.settings = new Settings.DeskletSettings(this, this.metadata.uuid, desklet_id);
        this.settings.bind('location', 'location', this._onSettingsChanged.bind(this));
        this.settings.bind('location-name', 'locationName', this._onSettingsChanged.bind(this));
        this.settings.bind('temperature-unit', 'temperatureUnit', this._onSettingsChanged.bind(this));
        this.settings.bind('wind-unit', 'windUnit', this._onSettingsChanged.bind(this));
        this.settings.bind('update-interval', 'updateInterval', this._onSettingsChanged.bind(this));
        this.settings.bind('show-humidity', 'showHumidity', this._onSettingsChanged.bind(this));
        this.settings.bind('show-precipitation', 'showPrecipitation', this._onSettingsChanged.bind(this));
        this.settings.bind('show-sunrise-sunset', 'showSunriseSunset', this._onSettingsChanged.bind(this));
        
        this.mainBox = new St.BoxLayout({
            vertical: true, 
            style: 'background-color: rgba(82, 45, 130, 0.97); padding: 20px; border-radius: 12px; color: #fff; width: 390px; border: 1px solid rgba(210, 70, 220, 0.9);'
        });
        
        const headerBox = new St.BoxLayout({vertical: false, style: 'margin-bottom: 16px;'});
        const headerLeft = new St.BoxLayout({vertical: true});
        
        this.locationLabel = new St.Label({text: 'Lüchow', style: 'font-size: 18px; font-weight: bold; color: #fff;'});
        headerLeft.add(this.locationLabel);
        
        this.tempLabel = new St.Label({text: '--°', style: 'font-size: 58px; font-weight: 900; color: #fff;'});
        headerLeft.add(this.tempLabel);
        
        headerBox.add(headerLeft);
        
        const headerRight = new St.BoxLayout({vertical: true, style: 'margin-left: 36px; margin-top: 6px;'});
        
        this.descLabel = new St.Label({text: 'Laden...', style: 'font-size: 16px; color: #fff; margin-bottom: 12px; font-weight: 700;'});
        headerRight.add(this.descLabel);
        
        const metricsBox = new St.BoxLayout({vertical: false});
        this.windLabel = new St.Label({text: '-- km/h', style: 'font-size: 13px; color: #ffd700; margin-right: 20px; font-weight: bold;'});
        metricsBox.add(this.windLabel);
        this.rainLabel = new St.Label({text: '--%', style: 'font-size: 13px; color: #ff6b35; margin-right: 20px; font-weight: bold;'});
        metricsBox.add(this.rainLabel);
        this.humidLabel = new St.Label({text: '--%', style: 'font-size: 13px; color: #00d9ff; font-weight: bold;'});
        metricsBox.add(this.humidLabel);
        headerRight.add(metricsBox);
        
        this.feelsLabel = new St.Label({text: 'gefühlt --°C', style: 'font-size: 13px; color: #e8e8e8; margin-top: 12px; font-weight: 600;'});
        headerRight.add(this.feelsLabel);
        
        this.minmaxLabel = new St.Label({text: '--°C/--°C', style: 'font-size: 13px; color: #e8e8e8; font-weight: 600;'});
        headerRight.add(this.minmaxLabel);
        
        headerBox.add(headerRight);
        this.mainBox.add(headerBox);
        
        const divider1 = new St.Label({text: '━━━━━━━━━━━━━━━━━━', style: 'font-size: 9px; color: rgba(255,255,255,0.45); margin: 8px 0;'});
        this.mainBox.add(divider1);
        
        const hourlyLabel = new St.Label({text: 'STÜNDLICH', style: 'font-size: 11px; color: #ffd700; font-weight: bold; margin-bottom: 7px;'});
        this.mainBox.add(hourlyLabel);
        
        const hourlyBox = new St.BoxLayout({vertical: false, style: 'margin-bottom: 10px;'});
        this.hourlyLabels = [];
        for (let i = 0; i < 6; i++) {
            const h = new St.BoxLayout({vertical: true, style: 'margin-right: 14px;'});
            const t = new St.Label({text: '18:00', style: 'font-size: 9px; color: #e8e8e8; font-weight: 700;'});
            h.add(t);
            const ic = new St.Label({text: '🌙', style: 'font-size: 22px; margin: 2px 0;'});
            h.add(ic);
            const te = new St.Label({text: '4°', style: 'font-size: 10px; color: #fff; font-weight: bold;'});
            h.add(te);
            hourlyBox.add(h);
            this.hourlyLabels.push({t, ic, te});
        }
        this.mainBox.add(hourlyBox);
        
        const sunBox = new St.BoxLayout({vertical: false, style: 'margin-bottom: 8px;'});
        this.sunriseLabel = new St.Label({text: '🌅 Aufgang 07:31', style: 'font-size: 13px; color: #ffd700; margin-right: 45px; font-weight: 700;'});
        sunBox.add(this.sunriseLabel);
        this.sunsetLabel = new St.Label({text: '🌇 Untergang 16:10', style: 'font-size: 13px; color: #ff6b35; font-weight: 700;'});
        sunBox.add(this.sunsetLabel);
        this.mainBox.add(sunBox);
        
        this.uvLabel = new St.Label({text: '☀️ UV 0', style: 'font-size: 10px; color: #00d9ff; margin-bottom: 8px; font-weight: 700;'});
        this.mainBox.add(this.uvLabel);
        
        const divider2 = new St.Label({text: '━━━━━━━━━━━━━━━━━━', style: 'font-size: 9px; color: rgba(255,255,255,0.45); margin: 8px 0;'});
        this.mainBox.add(divider2);
        
        const dailyLabel = new St.Label({text: '7-TAGE VORHERSAGE', style: 'font-size: 11px; color: #ffd700; font-weight: bold; margin-bottom: 8px;'});
        this.mainBox.add(dailyLabel);
        
        const dailyBox = new St.BoxLayout({vertical: false});
        this.dailyLabels = [];
        const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        for (let i = 0; i < 7; i++) {
            const d = new St.BoxLayout({vertical: true, style: 'margin-right: 10px;'});
            const dn = new St.Label({text: days[i], style: 'font-size: 9px; color: #e8e8e8; font-weight: 700;'});
            d.add(dn);
            const dic = new St.Label({text: '☁️', style: 'font-size: 18px; margin: 2px 0;'});
            d.add(dic);
            const dmin = new St.Label({text: '4°', style: 'font-size: 9px; color: #fff; font-weight: bold;'});
            d.add(dmin);
            const dmax = new St.Label({text: '9°', style: 'font-size: 9px; color: #e8e8e8;'});
            d.add(dmax);
            const dbar = new St.Label({text: '████░', style: 'font-size: 8px; color: #ff9800; margin-top: 3px; font-weight: bold;'});
            d.add(dbar);
            dailyBox.add(d);
            this.dailyLabels.push({dn, dic, dmin, dmax, dbar});
        }
        this.mainBox.add(dailyBox);
        
        this.setContent(this.mainBox);
        this.setHeader(_('TuX-Wetter'));
        this._menu.addAction(_('Nach GitHub-Updates suchen'), () => this._checkForUpdate());
        this._menu.addAction(_('GitHub-Projekt öffnen'), () => {
            imports.misc.util.spawnCommandLine('xdg-open https://github.com/' + REPOSITORY);
        });
        this._timeout = 0;
    }

    _onSettingsChanged() {
        if (!this.locationLabel) return;
        this.locationLabel.set_text(this.locationName || 'Lüchow');
        this.humidLabel.visible = this.showHumidity;
        this.rainLabel.visible = this.showPrecipitation;
        this.sunriseLabel.visible = this.showSunriseSunset;
        this.sunsetLabel.visible = this.showSunriseSunset;
        this._restartUpdateTimer();
        this._fetchData();
    }

    _restartUpdateTimer() {
        if (this._timeout) GLib.source_remove(this._timeout);
        this._timeout = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            Math.max(5, Number(this.updateInterval) || 30) * 60000,
            () => {
                this._fetchData();
                return true;
            }

            _formatTemperature(value) {
                if (this.temperatureUnit === 'fahrenheit') {
                    return Math.round((value * 9 / 5) + 32) + '°F';
                }
                return Math.round(value) + '°C';
            }

            _formatWind(value) {
                if (this.windUnit === 'ms') return (value / 3.6).toFixed(1) + ' m/s';
                if (this.windUnit === 'mph') return (value / 1.60934).toFixed(1) + ' mph';
                return Math.round(value) + ' km/h';
            }
        );
    }

    _notify(message) {
        Main.notify('TuX-Wetter', message);
    }

    _fetchText(url) {
        const command = 'curl -fsSL --max-time 15 "' + url + '"';
        const result = GLib.spawn_command_line_sync(command);
        if (!result[0] || !result[1]) {
            throw new Error('Download fehlgeschlagen');
        }
        return result[1].toString();
    }

    _checkForUpdate() {
        try {
            const remote = JSON.parse(this._fetchText(RAW_BASE_URL + 'metadata.json'));
            if (!remote.version || remote.version === LOCAL_VERSION) {
                this._notify(_('Das Desklet ist aktuell.'));
                return;
            }

            const dialog = new ModalDialog.ConfirmDialog(
                _('Version %s ist verfügbar. Jetzt installieren?').format(remote.version),
                () => this._installUpdate()
            );
            dialog.open();
        } catch (e) {
            global.logError('TuX-Wetter Update-Prüfung: ' + e);
            this._notify(_('Update-Prüfung fehlgeschlagen.'));
        }
    }

    _installUpdate() {
        try {
            const files = ['desklet.js', 'metadata.json', 'settings-schema.json'];
            for (let i = 0; i < files.length; i++) {
                const content = this._fetchText(RAW_BASE_URL + files[i]);
                const path = GLib.build_filenamev([
                    this.metadata.path,
                    files[i]
                ]);
                GLib.file_set_contents(path, content);
            }
            this._notify(_('Update installiert. Cinnamon lädt es beim nächsten Reload.'));
        } catch (e) {
            global.logError('TuX-Wetter Update-Installation: ' + e);
            this._notify(_('Update konnte nicht installiert werden.'));
        }
    }

    _getIcon(code) {
        const icons = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '⛈️',
            71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️', 80: '🌧️', 81: '⛈️',
            82: '⛈️', 85: '❄️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return icons[code] || '❓';
    }

    _getDesc(code) {
        const descs = {
            0: 'Klar', 1: 'Überwiegend klar', 2: 'Teilweise bewölkt', 3: 'Bewölkt',
            45: 'Neblig', 48: 'Neblig', 51: 'Leichter Regen', 53: 'Regen', 55: 'Starker Regen',
            61: 'Regen', 63: 'Starker Regen', 65: 'Schauer', 71: 'Schnee', 73: 'Schnee',
            75: 'Starker Schnee', 77: 'Schneekörner', 80: 'Regenschauer', 81: 'Schauer',
            82: 'Starker Schauer', 85: 'Schneeschauer', 86: 'Starker Schneeschauer',
            95: 'Gewitter', 96: 'Gewitter mit Hagel', 99: 'Gewitter mit Hagel'
        };
        return descs[code] || 'Unbekannt';
    }

    _fetchData() {
        try {
            const coordinates = String(this.location || '52.52,13.405').split(',');
            if (coordinates.length !== 2) throw new Error('Ungültiger Standort');
            const latitude = encodeURIComponent(coordinates[0].trim());
            const longitude = encodeURIComponent(coordinates[1].trim());
            const cmd = `curl -s "https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability,uv_index&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7"`;
            
            let [ok, out] = GLib.spawn_command_line_sync(cmd);
            if (!ok || !out) return;
            
            let j = JSON.parse(out.toString());
            if (!j.current) return;
            
            let c = j.current;
            this.tempLabel.set_text(this._formatTemperature(c.temperature_2m));
            this.descLabel.set_text(this._getDesc(c.weather_code));
            this.windLabel.set_text(this._formatWind(c.wind_speed_10m));
            this.rainLabel.set_text(Math.round(c.precipitation_probability) + '%');
            this.humidLabel.set_text(c.relative_humidity_2m + '%');
            this.feelsLabel.set_text('gefühlt ' + this._formatTemperature(c.apparent_temperature));
            this.uvLabel.set_text('☀️ UV ' + Math.round(c.uv_index));
            
            if (j.daily) {
                const sr = j.daily.sunrise[0].split('T')[1].substring(0, 5);
                const ss = j.daily.sunset[0].split('T')[1].substring(0, 5);
                this.sunriseLabel.set_text('🌅 Aufgang ' + sr);
                this.sunsetLabel.set_text('🌇 Untergang ' + ss);
                this.minmaxLabel.set_text(
                    this._formatTemperature(j.daily.temperature_2m_min[0]) + '/' +
                    this._formatTemperature(j.daily.temperature_2m_max[0])
                );
            }
            
            if (j.hourly && j.hourly.temperature_2m && j.hourly.weather_code) {
                const now = new Date();
                const idx = now.getHours();
                for (let i = 0; i < 6; i++) {
                    const h = idx + i;
                    if (h < j.hourly.temperature_2m.length) {
                        this.hourlyLabels[i].t.set_text((h % 24).toString().padStart(2, '0') + ':00');
                        this.hourlyLabels[i].ic.set_text(this._getIcon(j.hourly.weather_code[h]));
                        this.hourlyLabels[i].te.set_text(this._formatTemperature(j.hourly.temperature_2m[h]));
                    }
                }
            }
            
            if (j.daily && j.daily.weather_code) {
                for (let i = 0; i < 7; i++) {
                    if (i < j.daily.weather_code.length) {
                        const pct = j.daily.precipitation_probability_max[i] || 0;
                        const filled = Math.round(pct / 20);
                        const bar = '█'.repeat(filled) + '░'.repeat(5 - filled);
                        this.dailyLabels[i].dic.set_text(this._getIcon(j.daily.weather_code[i]));
                        this.dailyLabels[i].dmin.set_text(this._formatTemperature(j.daily.temperature_2m_min[i]));
                        this.dailyLabels[i].dmax.set_text(this._formatTemperature(j.daily.temperature_2m_max[i]));
                        this.dailyLabels[i].dbar.set_text(bar);
                    }
                }
            }
        } catch (e) {
            this.descLabel.set_text('Fehler');
        }
    }

    on_desklet_added_to_desktop() {
        this._onSettingsChanged();
        this._fetchData();
        this._restartUpdateTimer();
    }

    on_desklet_removed() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = 0;
        }
    }

    on_desklet_clicked() {
        this._fetchData();
    }
}

function main(metadata, desklet_id) {
    return new TuxWetterDesklet(metadata, desklet_id);
}
