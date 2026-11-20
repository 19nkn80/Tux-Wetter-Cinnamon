const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Desklet = imports.ui.desklet;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const ModalDialog = imports.ui.modalDialog;
const Settings = imports.ui.settings;

const REPOSITORY = '19nkn80/Tux-Wetter-Cinnamon';
const RAW_BASE_URL = 'https://raw.githubusercontent.com/' + REPOSITORY + '/main/';
const LOCAL_VERSION = '1.16.0';
const GRADIENT_STRIP_COUNT = 100;
const CARD_WIDTH = 760;
const CARD_HEIGHT = 750;

class TuxWetterDesklet extends Desklet.Desklet {
    constructor(metadata, desklet_id) {
        super(metadata, desklet_id);
        this.actor.set_style('background-color: transparent;');
        this.content.set_style('background-color: transparent;');
        this.actor.set_clip_to_allocation(true);
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
        this.showAirQuality = true;
        this.showPollen = true;
        this.showMoon = true;
        this.showWarnings = true;
        this.showTemperatureCurve = true;
        this.compactMode = false;
        this.textColor = '#ffffff';
        this.bgColor = '#16161d';
        this.opacity = 92;
        this.scalePercent = 72;
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
        this.settings.bind('show-air-quality', 'showAirQuality', this._onSettingsChanged.bind(this));
        this.settings.bind('show-pollen', 'showPollen', this._onSettingsChanged.bind(this));
        this.settings.bind('show-moon', 'showMoon', this._onSettingsChanged.bind(this));
        this.settings.bind('show-warnings', 'showWarnings', this._onSettingsChanged.bind(this));
        this.settings.bind('show-temperature-curve', 'showTemperatureCurve', this._onSettingsChanged.bind(this));
        this.settings.bind('compact-mode', 'compactMode', this._onSettingsChanged.bind(this));
        this.settings.bind('text-color', 'textColor', this._onSettingsChanged.bind(this));
        this.settings.bind('bg-color', 'bgColor', this._onSettingsChanged.bind(this));
        this.settings.bind('opacity', 'opacity', this._onSettingsChanged.bind(this));
        this.settings.bind('desklet-scale', 'scalePercent', this._onSettingsChanged.bind(this));
        this._normalizeColorThemeSetting();
        
        this.card = new St.Widget({
            layout_manager: new Clutter.BinLayout(),
            style: 'background-color: transparent;'
        });
        this.card.set_clip_to_allocation(true);
        this.card.set_width(CARD_WIDTH);
        this.card.set_height(CARD_HEIGHT);
        this.card.set_scale(0.72, 0.72);
        this.card.set_pivot_point(0, 0);
        this.background = new St.BoxLayout({vertical: true});
        this.background.set_width(CARD_WIDTH);
        this.background.set_height(CARD_HEIGHT);
        this.gradientStrips = [];
        for (let i = 0; i < GRADIENT_STRIP_COUNT; i++) {
            const strip = new Clutter.Actor();
            strip.set_background_color(new Clutter.Color({
                red: 61, green: 85, blue: 201, alpha: 255
            }));
            strip.set_height(CARD_HEIGHT / GRADIENT_STRIP_COUNT);
            strip.set_width(CARD_WIDTH);
            strip.set_x_expand(true);
            this.background.add_child(strip);
            this.gradientStrips.push(strip);
        }
        this.card.add_child(this.background);
        this.mainBox = new St.BoxLayout({
            vertical: true,
            style: 'padding: 22px 28px;'
        });
        this.mainBox.set_x_expand(true);
        this.mainBox.set_y_expand(true);
        this.card.add_child(this.mainBox);
        
        const headerBox = new St.BoxLayout({vertical: false, style: 'margin-bottom: 12px;'});
        const headerLeft = new St.BoxLayout({vertical: true});
        headerLeft.set_width(360);
        const locationBar = new St.BoxLayout({vertical: false, style: 'margin-bottom: 2px;'});
        this.previousLocationButton = new St.Button({label: '‹', style: 'font-size: 48px; color: #ffffff; padding: 0 12px;'});
        this.previousLocationButton.connect('clicked', () => this._cycleLocation(-1));
        this.previousLocationButton.connect('button-press-event', () => Clutter.EVENT_STOP);
        locationBar.add(this.previousLocationButton);
        this.locationLabel = new St.Label({text: 'Lüchow', style: 'font-size: 38px; font-weight: 600; color: #fff;'});
        locationBar.add(this.locationLabel);
        this.nextLocationButton = new St.Button({label: '›', style: 'font-size: 48px; color: #ffffff; padding: 0 12px;'});
        this.nextLocationButton.connect('clicked', () => this._cycleLocation(1));
        this.nextLocationButton.connect('button-press-event', () => Clutter.EVENT_STOP);
        locationBar.add(this.nextLocationButton);
        this.settingsButton = new St.Button({label: '⚙', style: 'font-size: 38px; color: #ffffff; padding: 0 12px;'});
        this.settingsButton.connect('clicked', () => this.configureDesklet());
        locationBar.add(this.settingsButton);
        headerLeft.add(locationBar);
        
        const temperatureBox = new St.BoxLayout({vertical: false});
        this.currentIcon = new St.Label({text: '☀️', style: 'font-size: 64px; margin: 4px 18px 0 0;'});
        temperatureBox.add(this.currentIcon);
        this.tempLabel = new St.Label({text: '--°', style: 'font-size: 82px; font-weight: 500; color: #fff;'});
        temperatureBox.add(this.tempLabel);
        headerLeft.add(temperatureBox);
        
        headerBox.add(headerLeft);
        
        const headerRight = new St.BoxLayout({vertical: true, style: 'margin-left: 18px; margin-top: 48px;'});
        headerRight.set_width(350);
        
        this.descLabel = new St.Label({text: 'Laden...', style: 'font-size: 27px; color: #fff; margin-bottom: 15px;'});
        headerRight.add(this.descLabel);
        this.providerLabel = new St.Label({
            text: 'Wetterdienst: Open-Meteo',
            style: 'font-size: 19px; color: rgba(255,255,255,0.85); margin-bottom: 8px;'
        });
        headerRight.add(this.providerLabel);
        
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
        
        const hourlyBox = new St.BoxLayout({vertical: false, style: 'margin-bottom: 12px;'});
        this.hourlyBox = hourlyBox;
        this.hourlyLabels = [];
        for (let i = 0; i < 6; i++) {
            const h = new St.BoxLayout({vertical: true, style: 'margin-right: 26px;'});
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
        
        const infoBox = new St.BoxLayout({vertical: true, style: 'margin-bottom: 12px;'});
        const infoRowOne = new St.BoxLayout({vertical: false, style: 'margin-bottom: 4px;'});
        this.sunriseLabel = new St.Label({text: 'Sonnenaufgang: 07:31', style: 'font-size: 18px; color: #fff; margin-right: 25px;'});
        infoRowOne.add(this.sunriseLabel);
        this.sunsetLabel = new St.Label({text: 'Sonnenuntergang: 16:10', style: 'font-size: 18px; color: #fff; margin-right: 25px;'});
        infoRowOne.add(this.sunsetLabel);
        this.uvLabel = new St.Label({text: '☀ UV-Index: 0', style: 'font-size: 18px; color: #fff;'});
        infoRowOne.add(this.uvLabel);
        infoBox.add(infoRowOne);
        const infoRowTwo = new St.BoxLayout({vertical: false});
        this.airLabel = new St.Label({text: 'Luftqualität: gut', style: 'font-size: 18px; color: #fff; margin-right: 25px;'});
        infoRowTwo.add(this.airLabel);
        this.pollenLabel = new St.Label({text: 'Pollenbelastung: --', style: 'font-size: 18px; color: #fff; margin-right: 25px;'});
        infoRowTwo.add(this.pollenLabel);
        this.rainNowLabel = new St.Label({text: 'Regenwahrscheinlichkeit: --', style: 'font-size: 18px; color: #fff;'});
        infoRowTwo.add(this.rainNowLabel);
        infoBox.add(infoRowTwo);
        this.mainBox.add(infoBox);

        this.moonLabel = new St.Label({
            text: '🌙 Mond: --',
            style: 'font-size: 17px; color: #fff; margin-bottom: 8px;'
        });
        this.mainBox.add(this.moonLabel);

        this.warningLabel = new St.Label({
            text: '',
            style: 'font-size: 18px; color: #fff; background-color: rgba(180, 45, 50, 0.75); padding: 5px 10px; margin-bottom: 7px;'
        });
        this.warningLabel.visible = false;
        this.mainBox.add(this.warningLabel);
        
        const dailyBox = new St.BoxLayout({vertical: true, style: 'border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px;'});
        this.dailyBox = dailyBox;
        this.dailyLabels = [];
        const days = ['Heute', 'Morgen', 'Sa', 'So', 'Mo'];
        for (let i = 0; i < 5; i++) {
            const d = new St.BoxLayout({vertical: false, style: 'margin-bottom: 3px;'});
            d.reactive = true;
            d.connect('button-press-event', () => {
                this._showDayCurve(i);
                return Clutter.EVENT_STOP;
            });
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

        this.curveLabel = new St.Label({
            text: 'Temperaturverlauf',
            style: 'font-size: 17px; color: #fff; margin-top: 8px;'
        });
        this.curveLabel.visible = false;
        this.mainBox.add(this.curveLabel);
        this.curveArea = new St.BoxLayout({vertical: false});
        this.curveArea.set_height(100);
        this.curveArea.set_x_expand(true);
        this.curveArea.visible = false;
        this.mainBox.add(this.curveArea);
        
        this.setContent(this.card);
        this.card.reactive = true;
        this.card.connect('scroll-event', (_actor, event) => {
            const direction = event.get_scroll_direction();
            if (direction === Clutter.ScrollDirection.UP) this._cycleLocation(-1);
            if (direction === Clutter.ScrollDirection.DOWN) this._cycleLocation(1);
            return Clutter.EVENT_STOP;
        });
        this.card.connect('button-press-event', (_actor, event) => {
            if (event.get_button() === 3) {
                this._cycleLocation(1);
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });
        this.setHeader(_('TuX-Wetter'));
        this._menu.addAction(_('Nach GitHub-Updates suchen'), () => this._checkForUpdate());
        this._menu.addAction(_('GitHub-Projekt öffnen'), () => {
            imports.misc.util.spawnCommandLine('xdg-open https://github.com/' + REPOSITORY);
        });
        this._timeout = 0;
        this._settingsTimeout = 0;
        this._settingsProcess = 0;
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
        this.airLabel.visible = this.showAirQuality;
        this.pollenLabel.visible = this.showPollen;
        this.moonLabel.visible = this.showMoon;
        this.warningLabel.visible = this.showWarnings && this.warningLabel.text !== '';
        this.hourlyBox.visible = !this.compactMode;
        this.dailyBox.visible = !this.compactMode;
        if (!this.showTemperatureCurve) {
            this.curveLabel.visible = false;
            this.curveArea.visible = false;
        }
        this._applyAppearance();
        if (this._settingsTimeout) GLib.source_remove(this._settingsTimeout);
        this._settingsTimeout = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            350,
            () => {
                this._restartUpdateTimer();
                this._settingsTimeout = 0;
                return false;
            }
        );
    }

    _getSavedLocationEntries() {
        const savedLocations = this.settings.getValue('saved-locations');
        if (Array.isArray(savedLocations)) {
            return savedLocations
                .filter((entry) => entry && entry.name && entry.coordinates)
                .map((entry) => ({
                    name: String(entry.name),
                    coordinates: String(entry.coordinates)
                }));
        }
        return String(savedLocations || '')
            .split(';')
            .filter((entry) => entry.indexOf('|') > 0)
            .map((entry) => {
                const separator = entry.indexOf('|');
                return {
                    name: entry.slice(0, separator),
                    coordinates: entry.slice(separator + 1)
                };
            });
    }

    _cycleLocation(step) {
        const entries = this._getSavedLocationEntries();
        if (entries.length < 2) {
            this._notify(_('Bitte mindestens zwei Orte speichern.'));
            return;
        }
        let current = entries.findIndex((entry) => entry.coordinates === String(this.location));
        if (current < 0) {
            current = entries.findIndex((entry) => entry.name === String(this.locationName));
        }
        if (current < 0) current = 0;
        const next = (current + step + entries.length) % entries.length;
        const selected = entries[next];
        this.locationName = selected.name;
        this.location = selected.coordinates;
        this.locationLabel.set_text(selected.name);
        this.settings.setValue('location-name', selected.name);
        this.settings.setValue('location', selected.coordinates);
        this._fetchData();
    }

    _getTheme() {
        const themes = {
            nacht: ['#6b315f', '#263ec2'],
            violett: ['#b74682', '#354bd4'],
            ozean: ['#168fc0', '#1649c7'],
            smaragd: ['#27b77d', '#214acb'],
            sonnenuntergang: ['#e05b68', '#6c43c7'],
            schiefer: ['#718bc2', '#2d4dca']
        };
        const labels = {
            nacht: 'Nachtblau',
            violett: 'Violett',
            ozean: 'Ozean',
            smaragd: 'Smaragd',
            sonnenuntergang: 'Sonnenuntergang',
            schiefer: 'Schiefer'
        };
        const storedValue = this._normalizeColorThemeSetting();
        const selectedTheme = themes[storedValue]
            ? storedValue
            : Object.keys(labels).find((key) => labels[key] === storedValue) || 'nacht';
        this.colorTheme = selectedTheme;
        return themes[selectedTheme];
    }

    _normalizeColorThemeSetting() {
        const labels = {
            'Nachtblau': 'nacht',
            'Violett': 'violett',
            'Ozean': 'ozean',
            'Smaragd': 'smaragd',
            'Sonnenuntergang': 'sonnenuntergang',
            'Schiefer': 'schiefer'
        };
        const value = this.settings.getValue('color-theme') || this.colorTheme;
        const normalized = labels[value] || value;
        const storedLabel = Object.keys(labels).find((label) => labels[label] === normalized) || normalized;
        if (storedLabel !== value) {
            this.settings.setValue('color-theme', storedLabel);
        }
        return normalized;
    }

    _hexToRgb(value) {
        const hex = String(value).replace('#', '');
        return [
            parseInt(hex.substring(0, 2), 16) / 255,
            parseInt(hex.substring(2, 4), 16) / 255,
            parseInt(hex.substring(4, 6), 16) / 255
        ];
    }

    _paintCurve() {
        const values = this.curveValues || [];
        if (values.length < 2) return;
        const min = Math.min.apply(null, values);
        const max = Math.max.apply(null, values);
        const range = Math.max(1, max - min);
        while (this.curveArea.get_n_children() > 0) {
            this.curveArea.get_child_at_index(0).destroy();
        }
        values.forEach((value) => {
            const bar = new Clutter.Actor({
                background_color: new Clutter.Color({red: 255, green: 216, blue: 32, alpha: 255}),
                x_align: Clutter.ActorAlign.FILL,
                y_align: Clutter.ActorAlign.END
            });
            bar.set_height(Math.max(8, Math.round(((value - min) / range) * 90) + 10));
            bar.set_x_expand(true);
            this.curveArea.add_child(bar);
        });
    }

    _showDayCurve(dayIndex) {
        if (!this.showTemperatureCurve || !this.hourlyData || !this.hourlyData.temperature_2m) return;
        const currentHour = new Date().getHours();
        const start = currentHour + dayIndex * 24;
        this.curveValues = this.hourlyData.temperature_2m.slice(start, start + 24);
        if (this.curveValues.length < 2) return;
        this.curveLabel.set_text('Temperaturverlauf – ' + this.dailyLabels[dayIndex].dn.text);
        this.curveLabel.visible = true;
        this.curveArea.visible = true;
        this._paintCurve();
    }

    _applyAppearance() {
        this._backgroundAlpha = Math.max(0.85, Math.min(1, Number(this.opacity) / 100 || 0.92));
        const scale = Math.max(0.5, Math.min(1, Number(this.scalePercent) / 100 || 0.72));
        const theme = this._getTheme();
        this.card.set_scale(scale, scale);
        this.content.set_width(CARD_WIDTH);
        this.content.set_height(CARD_HEIGHT);
        this.card.opacity = 255;
        this.card.set_style('background-color: transparent;');
        this._updateGradient(theme);
    }

    _updateGradient(theme) {
        const start = this._hexToRgb(theme[0]);
        const end = this._hexToRgb(theme[1]);
        this.gradientStrips.forEach((strip) => {
            this.background.remove_child(strip);
            strip.destroy();
        });
        this.gradientStrips = [];
        for (let index = 0; index < GRADIENT_STRIP_COUNT; index++) {
            const factor = index / (GRADIENT_STRIP_COUNT - 1);
            const color = [
                Math.round((start[0] + (end[0] - start[0]) * factor) * 255),
                Math.round((start[1] + (end[1] - start[1]) * factor) * 255),
                Math.round((start[2] + (end[2] - start[2]) * factor) * 255)
            ];
            const strip = new Clutter.Actor();
            strip.set_background_color(new Clutter.Color({
                red: color[0],
                green: color[1],
                blue: color[2],
                alpha: 255
            }));
            strip.set_height(CARD_HEIGHT / GRADIENT_STRIP_COUNT);
            strip.set_width(CARD_WIDTH);
            strip.set_x_expand(true);
            this.background.add_child(strip);
            this.gradientStrips.push(strip);
        }
        this.background.set_width(CARD_WIDTH);
        this.background.set_height(CARD_HEIGHT);
        this.background.queue_redraw();
        this.card.queue_redraw();
    }

    on_apply_settings_pressed() {
        this.colorTheme = this.settings.getValue('color-theme') || this.colorTheme;
        this._applyAppearance();
    }

    configureDesklet(tab = 0) {
        if (this._settingsProcess) {
            global.log('TuX-Wetter: Einstellungsfenster ist bereits geöffnet.');
            return;
        }
        try {
            super.configureDesklet(tab);
            this._settingsProcess = 1;
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                this._settingsProcess = 0;
                return false;
            });
        } catch (e) {
            global.logError('TuX-Wetter Einstellungen: ' + e);
            this._settingsProcess = 0;
        }
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

    on_auto_location_pressed() {
        try {
            const result = JSON.parse(this._fetchText('https://ipapi.co/json/'));
            if (!result.latitude || !result.longitude) {
                throw new Error('IP-Ortung lieferte keine Koordinaten');
            }
            const name = result.city || result.country_name || 'Automatischer Standort';
            this.settings.setValue('location-name', name);
            this.settings.setValue('location', result.latitude + ',' + result.longitude);
            this._notify(_('Standort über die IP-Adresse aktualisiert.'));
        } catch (e) {
            global.logError('TuX-Wetter automatische Standortsuche: ' + e);
            this._notify(_('Automatische Standortsuche fehlgeschlagen.'));
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

    _formatTime(value) {
        const text = String(value || '');
        if (text.indexOf('T') >= 0) return text.split('T')[1].substring(0, 5);
        return text.substring(0, 5) || '--:--';
    }

    _providerName() {
        return {
            'open-meteo': 'Open-Meteo',
            'wttr-in': 'wttr.in',
            'met-no': 'MET Norway / yr.no'
        }[this.weatherProvider] || this.weatherProvider;
    }

    _formatWind(value) {
        if (this.windUnit === 'ms') return (value / 3.6).toFixed(1) + ' m/s';
        if (this.windUnit === 'mph') return (value / 1.60934).toFixed(1) + ' mph';
        return Math.round(value) + ' km/h';
    }

    _windArrow(degrees) {
        const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
        return arrows[Math.round(Number(degrees || 0) / 45) % 8];
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

    _fetchMoon() {
        const coordinates = String(this.location).split(',');
        const now = new Date();
        const date = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');
        const result = JSON.parse(this._fetchText(
            'https://aa.usno.navy.mil/api/rstt/oneday?date=' + date +
            '&coords=' + coordinates[0] + ',' + coordinates[1]
        ));
        const data = result.properties.data;
        const rise = data.moondata.find((item) => item.phen === 'Rise');
        const set = data.moondata.find((item) => item.phen === 'Set');
        return {
            phase: data.curphase,
            illumination: data.fracillum,
            rise: rise ? rise.time : '--:--',
            set: set ? set.time : '--:--'
        };
    }

    _pollenText(value) {
        const amount = Number(value || 0);
        if (amount < 1) return 'gering';
        if (amount < 10) return 'mäßig';
        return 'hoch';
    }

    _fetchLocalWarning() {
        const raw = this._fetchText(
            'https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json'
        );
        const match = raw.match(/loadWarnings\((\{.*\})\);?\s*$/s);
        if (!match) throw new Error('DWD-Warnungsformat unbekannt');
        const data = JSON.parse(match[1]);
        const target = String(this.locationName || '').split(',')[0].toLowerCase();
        const warnings = [];
        Object.keys(data.warnings || {}).forEach((key) => {
            (data.warnings[key] || []).forEach((warning) => {
                const region = String(warning.regionName || '').toLowerCase();
                if (!target || region.indexOf(target) >= 0) warnings.push(warning);
            });
        });
        warnings.sort((left, right) => Number(right.level || 0) - Number(left.level || 0));
        return warnings[0] || null;
    }

    _fetchAustrianWarning() {
        const coordinates = String(this.location).split(',');
        const latitude = Number(coordinates[0]);
        const longitude = Number(coordinates[1]);
        if (latitude < 46.3 || latitude > 49.1 || longitude < 9.5 || longitude > 17.2) {
            return null;
        }
        const data = JSON.parse(this._fetchText(
            'https://warnungen.zamg.at/wsapp/api/getWarningsForCoords?lon=' +
            coordinates[1] + '&lat=' + coordinates[0] + '&lang=de'
        ));
        const warnings = data.properties && data.properties.warnings || [];
        warnings.sort((left, right) =>
            Number(right.properties.warnstufeid || 0) - Number(left.properties.warnstufeid || 0)
        );
        return warnings.length ? warnings[0].properties : null;
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
                cmd = `curl -s "https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability,uv_index,pressure_msl&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7"`;
            }
            
            let [ok, out] = GLib.spawn_command_line_sync(cmd);
            if (!ok || !out) return;
            
            let j = JSON.parse(out.toString());
            if (this.weatherProvider === 'wttr-in') j = this._normalizeWttr(j);
            if (this.weatherProvider === 'met-no') j = this._normalizeMetNorway(j);
            if (!j.current) return;
            
            let c = j.current;
            this.providerLabel.set_text('Wetterdienst: ' + this._providerName());
            let air = null;
            try {
                air = JSON.parse(this._fetchText(
                    'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' +
                    latitude + '&longitude=' + longitude +
                    '&current=european_aqi,pm2_5,pm10&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=auto&forecast_days=1'
                ));
            } catch (e) {
                global.logError('TuX-Wetter Luftqualitätsdaten: ' + e);
            }
            this.tempLabel.set_text(this._formatTemperature(c.temperature_2m));
            this.descLabel.set_text(this._getDesc(c.weather_code));
            this.windLabel.set_text(
                this._windArrow(c.wind_direction_10m) + ' ' + this._formatWind(c.wind_speed_10m)
            );
            this.rainLabel.set_text(Math.round(c.precipitation_probability) + '%');
            this.humidLabel.set_text(c.relative_humidity_2m + '%');
            this.pressureLabel.set_text(Math.round(c.pressure_msl || 0) + ' hPa');
            this.feelsLabel.set_text('gefühlt ' + this._formatTemperature(c.apparent_temperature));
            this.currentIcon.set_text(this._getIcon(c.weather_code));
            this.uvLabel.set_text('☀ UV-Index: ' + Math.round(c.uv_index));
            if (air && air.current) {
                this.airLabel.set_text('Luftqualität: ' + Math.round(air.current.european_aqi));
            }
            if (air && air.hourly) {
                const pollenValues = [
                    air.hourly.alder_pollen,
                    air.hourly.birch_pollen,
                    air.hourly.grass_pollen,
                    air.hourly.mugwort_pollen,
                    air.hourly.olive_pollen,
                    air.hourly.ragweed_pollen
                ].map((values) => Number(values && values[new Date().getHours()] || 0));
                this.pollenLabel.set_text(
                    'Pollenbelastung: ' + this._pollenText(Math.max.apply(null, pollenValues))
                );
            }
            if (this.showMoon) {
                try {
                    const moon = this._fetchMoon();
                    this.moonLabel.set_text(
                        '🌙 ' + moon.phase + ' (' + moon.illumination +
                        ') · Aufgang ' + moon.rise + ' · Untergang ' + moon.set
                    );
                } catch (e) {
                    global.logError('TuX-Wetter Monddaten: ' + e);
                    this.moonLabel.set_text('🌙 Mond: nicht verfügbar');
                }
            }
            if (c.weather_code >= 95) {
                this.warningLabel.set_text('⚠ Unwetterhinweis: ' + this._getDesc(c.weather_code));
                this.warningLabel.visible = true;
            } else {
                this.warningLabel.visible = false;
            }
            if (this.showWarnings) {
                try {
                    let warning = null;
                    try {
                        warning = this._fetchLocalWarning();
                    } catch (dwdError) {
                        global.logError('TuX-Wetter DWD-Warnungen: ' + dwdError);
                    }
                    if (!warning) warning = this._fetchAustrianWarning();
                    if (warning) {
                        this.warningLabel.set_text(
                            '⚠ ' + (warning.event || warning.text || 'Wetterwarnung') + ': ' +
                            String(warning.description || warning.meteotext || '').substring(0, 180)
                        );
                        this.warningLabel.visible = true;
                    }
                } catch (e) {
                    global.logError('TuX-Wetter regionale Warnungen: ' + e);
                }
            }
            this.feelsLabel.set_text(
                'gefühlt ' + this._formatTemperature(c.apparent_temperature) + '    ' +
                (j.daily ? this._formatTemperature(j.daily.temperature_2m_max[0]) : '--') + ' / ' +
                (j.daily ? this._formatTemperature(j.daily.temperature_2m_min[0]) : '--')
            );
            
            if (j.daily) {
                const sr = this._formatTime(j.daily.sunrise[0]);
                const ss = this._formatTime(j.daily.sunset[0]);
                this.sunriseLabel.set_text('Sonnenaufgang: ' + sr);
                this.sunsetLabel.set_text('Sonnenuntergang: ' + ss);
            }
            
            if (j.hourly && j.hourly.temperature_2m && j.hourly.weather_code) {
                this.hourlyData = j.hourly;
                const now = new Date();
                const idx = now.getHours();
                for (let i = 0; i < 6; i++) {
                    const h = idx + i;
                    if (h < j.hourly.temperature_2m.length) {
                        this.hourlyLabels[i].t.set_text((h % 24).toString().padStart(2, '0') + ':00');
                        this.hourlyLabels[i].ic.set_text(this._getIcon(j.hourly.weather_code[h]));
                        this.hourlyLabels[i].te.set_text(this._formatTemperature(j.hourly.temperature_2m[h]));
                        if (i === 0 && j.hourly.precipitation_probability) {
                            this.rainNowLabel.set_text(
                                'Regenwahrscheinlichkeit: ' +
                                Math.round(j.hourly.precipitation_probability[h]) + '%'
                            );
                        }
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
            global.logError('TuX-Wetter Datenabruf: ' + e);
            this.descLabel.set_text('Fehler');
        }
    }

    on_desklet_added_to_desktop() {
        this._onSettingsChanged();
        this._fetchData();
    }

    on_desklet_removed() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = 0;
        }
        if (this._settingsTimeout) {
            GLib.source_remove(this._settingsTimeout);
            this._settingsTimeout = 0;
        }
    }

    on_desklet_clicked() {
        this._fetchData();
    }

    on_refresh_pressed() {
        this._fetchData();
    }
}

function main(metadata, desklet_id) {
    return new TuxWetterDesklet(metadata, desklet_id);
}
