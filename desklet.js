const St = imports.gi.St;
const Desklet = imports.ui.desklet;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const ModalDialog = imports.ui.modalDialog;
const Settings = imports.ui.settings;

const REPOSITORY = '19nkn80/Tux-Wetter-Cinnamon';
const RAW_BASE_URL = 'https://raw.githubusercontent.com/' + REPOSITORY + '/main/';
const LOCAL_VERSION = '1.6.0';

class TuxWetterDesklet extends Desklet.Desklet {
    constructor(metadata, desklet_id) {
        super(metadata, desklet_id);
        this.desklet_id = desklet_id;
        this.location = '52.52,13.405';
        this.locationName = 'Lüchow';
        this.updateInterval = 30;
        this.temperatureUnit = 'celsius';
        this.windUnit = 'kmh';
        this.weatherProvider = 'open-meteo';
        this.colorTheme = 'nacht';
        this.savedLocations = 'Lüchow|52.9667,11.15';
        this.showHumidity = true;
        this.showPressure = true;
        this.showUvIndex = true;
        this.showPrecipitation = true;
        this.showSunriseSunset = true;
        this.compactMode = false;
        this.textColor = '#ffffff';
        this.bgColor = '#16161d';
        this.opacity = 92;
        this._theme = St.ThemeContext.get_for_stage(global.stage).get_theme();
        this._stylesheetPath = this.metadata.path + '/stylesheet.css';
        this._theme.load_stylesheet(this._stylesheetPath);
        this.settings = new Settings.DeskletSettings(this, this.metadata.uuid, desklet_id);
        this.settings.bind('location', 'location', this._onSettingsChanged.bind(this));
        this.settings.bind('location-name', 'locationName', this._onSettingsChanged.bind(this));
        this.settings.bind('temperature-unit', 'temperatureUnit', this._onSettingsChanged.bind(this));
        this.settings.bind('wind-unit', 'windUnit', this._onSettingsChanged.bind(this));
        this.settings.bind('weather-provider', 'weatherProvider', this._onSettingsChanged.bind(this));
        this.settings.bind('color-theme', 'colorTheme', this._onSettingsChanged.bind(this));
        this.settings.bind('saved-locations', 'savedLocations', this._onSettingsChanged.bind(this));
        this.settings.bind('update-interval', 'updateInterval', this._onSettingsChanged.bind(this));
        this.settings.bind('show-humidity', 'showHumidity', this._onSettingsChanged.bind(this));
        this.settings.bind('show-pressure', 'showPressure', this._onSettingsChanged.bind(this));
        this.settings.bind('show-uv-index', 'showUvIndex', this._onSettingsChanged.bind(this));
        this.settings.bind('show-precipitation', 'showPrecipitation', this._onSettingsChanged.bind(this));
        this.settings.bind('show-sunrise-sunset', 'showSunriseSunset', this._onSettingsChanged.bind(this));
        this.settings.bind('compact-mode', 'compactMode', this._onSettingsChanged.bind(this));
        this.settings.bind('text-color', 'textColor', this._onSettingsChanged.bind(this));
        this.settings.bind('bg-color', 'bgColor', this._onSettingsChanged.bind(this));
        this.settings.bind('opacity', 'opacity', this._onSettingsChanged.bind(this));
        
        this.mainBox = new St.BoxLayout({
            vertical: true, 
            style_class: 'tux-wetter-card tux-wetter-theme-nacht',
            style: 'width: 760px;'
        });
        
        const headerBox = new St.BoxLayout({vertical: false, style: 'margin-bottom: 18px;'});
        const headerLeft = new St.BoxLayout({vertical: true});
        headerLeft.set_width(360);
        const locationBar = new St.BoxLayout({vertical: false, style: 'margin-bottom: 2px;'});
        this.previousLocationButton = new St.Button({label: '‹', style: 'font-size: 22px; color: #d7b5ff; padding: 0 7px;'});
        this.previousLocationButton.connect('clicked', () => this._cycleLocation(-1));
        locationBar.add(this.previousLocationButton);
        this.locationLabel = new St.Label({text: 'Lüchow', style: 'font-size: 28px; font-weight: 500; color: #fff;'});
        locationBar.add(this.locationLabel);
        this.nextLocationButton = new St.Button({label: '›', style: 'font-size: 22px; color: #d7b5ff; padding: 0 7px;'});
        this.nextLocationButton.connect('clicked', () => this._cycleLocation(1));
        locationBar.add(this.nextLocationButton);
        this.settingsButton = new St.Button({label: '⚙', style: 'font-size: 17px; color: #d7b5ff; padding: 0 7px;'});
        this.settingsButton.connect('clicked', () => this.configureDesklet());
        locationBar.add(this.settingsButton);
        headerLeft.add(locationBar);
        
        const temperatureBox = new St.BoxLayout({vertical: false});
        this.currentIcon = new St.Label({text: '☀️', style: 'font-size: 64px; margin: 4px 18px 0 0;'});
        temperatureBox.add(this.currentIcon);
        this.tempLabel = new St.Label({text: '--°', style: 'font-size: 86px; font-weight: 500; color: #fff;'});
        temperatureBox.add(this.tempLabel);
        headerLeft.add(temperatureBox);
        
        headerBox.add(headerLeft);
        
        const headerRight = new St.BoxLayout({vertical: true, style: 'margin-left: 20px; margin-top: 54px;'});
        headerRight.set_width(350);
        
        this.descLabel = new St.Label({text: 'Laden...', style: 'font-size: 27px; color: #fff; margin-bottom: 15px;'});
        headerRight.add(this.descLabel);
        
        const metricsBox = new St.BoxLayout({vertical: false});
        this.windLabel = new St.Label({text: '💨 -- km/h', style: 'font-size: 19px; color: #fff; margin-right: 28px;'});
        metricsBox.add(this.windLabel);
        this.rainLabel = new St.Label({text: '☔ --%', style: 'font-size: 19px; color: #fff; margin-right: 28px;'});
        metricsBox.add(this.rainLabel);
        this.humidLabel = new St.Label({text: '💧 --%', style: 'font-size: 19px; color: #fff;'});
        metricsBox.add(this.humidLabel);
        this.pressureLabel = new St.Label({text: '-- hPa', style: 'font-size: 11px; color: #d0d0d0; margin-top: 5px;'});
        headerRight.add(metricsBox);
        
        this.feelsLabel = new St.Label({text: 'gefühlt --°C    --° / --°', style: 'font-size: 19px; color: #e8e8e8; margin-top: 16px;'});
        headerRight.add(this.feelsLabel);
        
        headerBox.add(headerRight);
        this.mainBox.add(headerBox);
        
        const hourlyBox = new St.BoxLayout({vertical: false, style: 'margin-bottom: 18px;'});
        this.hourlyBox = hourlyBox;
        this.hourlyLabels = [];
        for (let i = 0; i < 6; i++) {
            const h = new St.BoxLayout({vertical: true, style: 'margin-right: 31px;'});
            const t = new St.Label({text: '18:00', style: 'font-size: 20px; color: #ddd;'});
            h.add(t);
            const ic = new St.Label({text: '🌙', style: 'font-size: 38px; margin: 7px 0;'});
            h.add(ic);
            const te = new St.Label({text: '4°', style: 'font-size: 25px; color: #fff;'});
            h.add(te);
            hourlyBox.add(h);
            this.hourlyLabels.push({t, ic, te});
        }
        this.mainBox.add(hourlyBox);
        
        const infoBox = new St.BoxLayout({vertical: false, style: 'margin-bottom: 18px;'});
        this.sunriseLabel = new St.Label({text: '🌅 07:31', style: 'font-size: 19px; color: #fff; margin-right: 25px;'});
        infoBox.add(this.sunriseLabel);
        this.sunsetLabel = new St.Label({text: '🌇 16:10', style: 'font-size: 19px; color: #fff; margin-right: 25px;'});
        infoBox.add(this.sunsetLabel);
        this.uvLabel = new St.Label({text: '🌙 UV: 0', style: 'font-size: 19px; color: #fff; margin-right: 25px;'});
        infoBox.add(this.uvLabel);
        this.airLabel = new St.Label({text: 'Luft: gut', style: 'font-size: 19px; color: #fff; margin-right: 25px;'});
        infoBox.add(this.airLabel);
        this.pollenLabel = new St.Label({text: 'Pollen: --', style: 'font-size: 19px; color: #fff; margin-right: 25px;'});
        infoBox.add(this.pollenLabel);
        this.rainNowLabel = new St.Label({text: 'Regen: --', style: 'font-size: 19px; color: #fff;'});
        infoBox.add(this.rainNowLabel);
        this.mainBox.add(infoBox);
        
        const dailyBox = new St.BoxLayout({vertical: true, style: 'border-top: 1px solid rgba(255,255,255,0.3); padding-top: 10px;'});
        this.dailyBox = dailyBox;
        this.dailyLabels = [];
        const days = ['Heute', 'Morgen', 'Sa', 'So', 'Mo'];
        for (let i = 0; i < 5; i++) {
            const d = new St.BoxLayout({vertical: false, style: 'margin-bottom: 6px;'});
            const dn = new St.Label({text: days[i], style: 'font-size: 21px; color: #eee; width: 105px;'});
            d.add(dn);
            const dic = new St.Label({text: '☁️', style: 'font-size: 27px; width: 50px;'});
            d.add(dic);
            const rain = new St.Label({text: '--%', style: 'font-size: 18px; color: #a9d8ff; width: 115px;'});
            d.add(rain);
            const dmin = new St.Label({text: '4°', style: 'font-size: 20px; color: #ddd; width: 55px;'});
            d.add(dmin);
            const dbar = new St.Label({text: '━━━━━━', style: 'font-size: 16px; color: #ffd43b; width: 330px;'});
            d.add(dbar);
            const dmax = new St.Label({text: '9°', style: 'font-size: 20px; color: #fff;'});
            d.add(dmax);
            dailyBox.add(d);
            this.dailyLabels.push({dn, dic, rain, dmin, dmax, dbar});
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
        this.pressureLabel.visible = this.showPressure;
        this.uvLabel.visible = this.showUvIndex;
        this.rainLabel.visible = this.showPrecipitation;
        this.sunriseLabel.visible = this.showSunriseSunset;
        this.sunsetLabel.visible = this.showSunriseSunset;
        this.hourlyBox.visible = !this.compactMode;
        this.dailyBox.visible = !this.compactMode;
        this._applyAppearance();
        this._restartUpdateTimer();
        this._fetchData();
    }

    _getSavedLocationEntries() {
        if (Array.isArray(this.savedLocations)) {
            return this.savedLocations.map((entry) => entry.name + '|' + entry.coordinates);
        }
        return String(this.savedLocations || '').split(';').filter((entry) => entry.indexOf('|') > 0);
    }

    _cycleLocation(step) {
        const entries = this._getSavedLocationEntries();
        if (entries.length < 2) return;
        let current = entries.findIndex((entry) => entry.split('|')[1] === this.location);
        if (current < 0) current = 0;
        const next = (current + step + entries.length) % entries.length;
        const parts = entries[next].split('|');
        this.settings.setValue('location-name', parts[0]);
        this.settings.setValue('location', parts.slice(1).join('|'));
    }

    _getTheme() {
        const themes = {
            nacht: ['#16161d', '#29263d'],
            violett: ['#4c1d95', '#7e22ce'],
            ozean: ['#075985', '#0e7490'],
            smaragd: ['#064e3b', '#047857'],
            sonnenuntergang: ['#7c2d12', '#be185d'],
            schiefer: ['#1e293b', '#475569']
        };
        return themes[this.colorTheme] || themes.nacht;
    }

    _applyAppearance() {
        const opacity = Math.max(0, Math.min(100, Number(this.opacity) || 92)) / 100;
        this.mainBox.style_class = 'tux-wetter-card tux-wetter-theme-' + this.colorTheme;
        this.mainBox.opacity = Math.round(opacity * 255);
    }

    on_location_search_pressed() {
        try {
            const query = String(this.settings.getValue('location-search') || '').trim();
            if (!query) throw new Error('Kein Suchbegriff');
            const encoded = encodeURIComponent(query);
            const result = JSON.parse(this._fetchText(
                'https://geocoding-api.open-meteo.com/v1/search?name=' + encoded +
                '&count=10&language=de&format=json'
            ));
            if (!result.results || result.results.length === 0) {
                this._notify(_('Ort nicht gefunden.'));
                return;
            }
            const wanted = query.toLowerCase();
            const place = result.results.find((candidate) =>
                String(candidate.name).toLowerCase() === wanted
            ) || result.results.find((candidate) =>
                String(candidate.country || '').toLowerCase() === 'deutschland'
            ) || result.results[0];
            const name = place.name + (place.country ? ', ' + place.country : '');
            const coordinates = place.latitude + ',' + place.longitude;
            this.settings.setValue('location-name', name);
            this.settings.setValue('location', coordinates);
            const saved = this.settings.getValue('saved-locations');
            const entries = Array.isArray(saved) ? saved.slice() : [];
            const exists = entries.some((entry) =>
                entry.name === name && entry.coordinates === coordinates
            );
            if (!exists) entries.push({name: name, coordinates: coordinates});
            this.settings.setValue('saved-locations', entries);
            this._notify(_('Standort gespeichert: ') + name);
        } catch (e) {
            global.logError('TuX-Wetter Ortssuche: ' + e);
            this._notify(_('Ortssuche fehlgeschlagen.'));
        }
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
        );
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
            const files = ['desklet.js', 'metadata.json', 'settings-schema.json', 'stylesheet.css'];
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

    _codeFromText(text) {
        const value = String(text || '').toLowerCase();
        if (value.indexOf('thunder') >= 0 || value.indexOf('gewitter') >= 0) return 95;
        if (value.indexOf('snow') >= 0 || value.indexOf('schnee') >= 0) return 71;
        if (value.indexOf('rain') >= 0 || value.indexOf('regen') >= 0 ||
            value.indexOf('drizzle') >= 0) return 61;
        if (value.indexOf('fog') >= 0 || value.indexOf('nebel') >= 0) return 45;
        if (value.indexOf('cloud') >= 0 || value.indexOf('bewölkt') >= 0) return 2;
        return 0;
    }

    _codeFromSymbol(symbol) {
        const text = String(symbol || '').replace(/_/g, ' ');
        return this._codeFromText(text);
    }

    _normalizeMetNorway(data) {
        const series = data.properties.timeseries;
        if (!series || series.length === 0) throw new Error('MET Norway lieferte keine Daten');
        const values = series.slice(0, 168);
        const first = values[0].data.instant.details;
        const currentSymbol = values[0].data.next_1_hours ?
            values[0].data.next_1_hours.summary.symbol_code : '';
        const daily = [];
        for (let day = 0; day < 7; day++) {
            const item = values[Math.min(day * 24, values.length - 1)];
            const details = item.data.instant.details;
            daily.push({
                temperature_2m_max: Number(details.air_temperature),
                temperature_2m_min: Number(details.air_temperature),
                weather_code: this._codeFromSymbol(item.data.next_1_hours ?
                    item.data.next_1_hours.summary.symbol_code : ''),
                precipitation_probability_max: 0
            });
        }
        return {
            current: {
                temperature_2m: Number(first.air_temperature),
                relative_humidity_2m: Number(first.relative_humidity),
                apparent_temperature: Number(first.air_temperature),
                weather_code: this._codeFromSymbol(currentSymbol),
                wind_speed_10m: Number(first.wind_speed),
                precipitation_probability: 0,
                uv_index: 0,
                pressure_msl: Number(first.air_pressure_at_sea_level)
            },
            hourly: {
                temperature_2m: values.slice(0, 6).map((item) =>
                    Number(item.data.instant.details.air_temperature)
                ),
                weather_code: values.slice(0, 6).map((item) => this._codeFromSymbol(
                    item.data.next_1_hours ? item.data.next_1_hours.summary.symbol_code : ''
                ))
            },
            daily: {
                weather_code: daily.map((item) => item.weather_code),
                temperature_2m_max: daily.map((item) => item.temperature_2m_max),
                temperature_2m_min: daily.map((item) => item.temperature_2m_min),
                precipitation_probability_max: daily.map((item) => item.precipitation_probability_max),
                sunrise: ['--:--'],
                sunset: ['--:--']
            }
        };
    }

    _normalizeWttr(data) {
        const current = data.current_condition[0];
        const today = data.weather[0];
        const hourly = today.hourly.slice(0, 6);
        const weather = data.weather.slice(0, 7);
        return {
            current: {
                temperature_2m: Number(current.temp_C),
                relative_humidity_2m: Number(current.humidity),
                apparent_temperature: Number(current.FeelsLikeC),
                weather_code: this._codeFromText(current.weatherDesc[0].value),
                wind_speed_10m: Number(current.windspeedKmph),
                precipitation_probability: Number(current.chanceofrain || 0),
                uv_index: Number(current.uvIndex || 0),
                pressure_msl: Number(current.pressure)
            },
            hourly: {
                temperature_2m: hourly.map((entry) => Number(entry.tempC)),
                weather_code: hourly.map((entry) => this._codeFromText(entry.weatherDesc[0].value))
            },
            daily: {
                weather_code: weather.map((entry) => this._codeFromText(entry.hourly[4].weatherDesc[0].value)),
                temperature_2m_max: weather.map((entry) => Number(entry.maxtempC)),
                temperature_2m_min: weather.map((entry) => Number(entry.mintempC)),
                precipitation_probability_max: weather.map((entry) => Number(entry.hourly[4].chanceofrain || 0)),
                sunrise: [today.astronomy[0].sunrise],
                sunset: [today.astronomy[0].sunset]
            }
        };
    }

    _fetchData() {
        try {
            const coordinates = String(this.location || '52.52,13.405').split(',');
            if (coordinates.length !== 2) throw new Error('Ungültiger Standort');
            const latitude = encodeURIComponent(coordinates[0].trim());
            const longitude = encodeURIComponent(coordinates[1].trim());
            let cmd;
            if (this.weatherProvider === 'wttr-in') {
                cmd = `curl -s "https://wttr.in/${latitude},${longitude}?format=j1"`;
            } else if (this.weatherProvider === 'met-no') {
                cmd = `curl -s -A "TuX-Wetter/1.3" "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}"`;
            } else {
                cmd = `curl -s "https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability,uv_index,pressure_msl&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7"`;
            }
            
            let [ok, out] = GLib.spawn_command_line_sync(cmd);
            if (!ok || !out) return;
            
            let j = JSON.parse(out.toString());
            if (this.weatherProvider === 'wttr-in') j = this._normalizeWttr(j);
            if (this.weatherProvider === 'met-no') j = this._normalizeMetNorway(j);
            if (!j.current) return;
            
            let c = j.current;
            this.tempLabel.set_text(this._formatTemperature(c.temperature_2m));
            this.descLabel.set_text(this._getDesc(c.weather_code));
            this.windLabel.set_text(this._formatWind(c.wind_speed_10m));
            this.rainLabel.set_text(Math.round(c.precipitation_probability) + '%');
            this.humidLabel.set_text(c.relative_humidity_2m + '%');
            this.pressureLabel.set_text(Math.round(c.pressure_msl || 0) + ' hPa');
            this.feelsLabel.set_text('gefühlt ' + this._formatTemperature(c.apparent_temperature));
            this.currentIcon.set_text(this._getIcon(c.weather_code));
            this.uvLabel.set_text('🌙 UV: ' + Math.round(c.uv_index));
            this.feelsLabel.set_text(
                'gefühlt ' + this._formatTemperature(c.apparent_temperature) + '    ' +
                (j.daily ? this._formatTemperature(j.daily.temperature_2m_max[0]) : '--') + ' / ' +
                (j.daily ? this._formatTemperature(j.daily.temperature_2m_min[0]) : '--')
            );
            
            if (j.daily) {
                const sr = j.daily.sunrise[0].split('T')[1].substring(0, 5);
                const ss = j.daily.sunset[0].split('T')[1].substring(0, 5);
                this.sunriseLabel.set_text('🌅 Aufgang ' + sr);
                this.sunsetLabel.set_text('🌇 Untergang ' + ss);
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
                for (let i = 0; i < this.dailyLabels.length; i++) {
                    if (i < j.daily.weather_code.length) {
                        const pct = j.daily.precipitation_probability_max[i] || 0;
                        const filled = Math.round(pct / 20);
                        const bar = '█'.repeat(filled) + '░'.repeat(5 - filled);
                        this.dailyLabels[i].dic.set_text(this._getIcon(j.daily.weather_code[i]));
                        this.dailyLabels[i].rain.set_text(Math.round(pct) + '%');
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
    }

    on_desklet_removed() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = 0;
        }
        if (this._theme && this._stylesheetPath) {
            this._theme.unload_stylesheet(this._stylesheetPath);
        }
    }

    on_desklet_clicked() {
        this._fetchData();
    }
}

function main(metadata, desklet_id) {
    return new TuxWetterDesklet(metadata, desklet_id);
}
