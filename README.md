# TuX-Wetter Cinnamon Desklet

Ein Weather-Desklet für Cinnamon Desktop Environment 6.6.9+

## Features

✅ **Echte Wetterdaten** - Aktuelle Temperatur, Wind, Wetterbeschreibung
✅ **Open-Meteo API** - Kostenlos, kein API-Key notwendig
✅ **Auto-Update** - Aktualisiert alle 30 Minuten automatisch
✅ **Einstellungen** - Standort, Einheiten, Sichtbarkeit und Intervall
✅ **GitHub-Updates** - Update-Prüfung und Installation über das Kontextmenü
✅ **Glas-Karten-Design** - Direkt mit Cairo gezeichneter Verlauf, unabhängig vom Cinnamon-CSS-Theme
✅ **Mehrere Orte** - Ortsliste mit Pfeilnavigation und Zahnrad für Einstellungen
✅ **Zusätzliche Wetterdaten** - Windrichtung, Luftqualitätsindex und Regenwahrscheinlichkeit
✅ **Ortssteuerung** - Pfeile, Mausrad, Rechtsklick und automatische IP-Ortung
✅ **Mond und Pollen** - Mondphase/-zeiten und sechs Pollenarten
✅ **Warnungen** - DWD- und GeoSphere-Austria-Warnungen ohne API-Key
✅ **Temperaturkurve** - Tagesverlauf per Klick auf eine Tageszeile
✅ **Einfache Installation** - Plug & Play für Cinnamon

## Installation

Bereits installiert unter:
```
~/.local/share/cinnamon/desklets/tux-wetter@cinnamon-desklet/
```

## Verwendung

1. Öffne Cinnamon Desklets Manager (Rechtsklick Desktop → Desklets hinzufügen)
2. Wähle "TuX-Wetter" aus der Liste
3. Klick auf das "+" Button um auf den Desktop zu platzieren
4. Der Desklet erscheint auf deinem Desktop mit aktuellen Wetterdaten

## Konfiguration

Die Einstellungen können im Desklet-Manager angepasst werden:
- **Standort**: Breitengrad,Längengrad (z.B. 52.52,13.405 für Berlin)
- **Update-Interval**: Aktualisierungshäufigkeit in Minuten

Per Rechtsklick auf das Desklet stehen zusätzlich „Nach GitHub-Updates suchen“
und der Link zum Projekt zur Verfügung.

## Technische Details

- **API**: Open-Meteo (https://open-meteo.com)
- **Implementation**: GJS (GNOME JavaScript)
- **HTTP-Client**: curl + GLib.spawn_command_line_sync
- **Styling**: Clutter/St und Cairo, ohne HTML und ohne abhängiges Theme-CSS
- **Updates**: https://github.com/19nkn80/Tux-Wetter-Cinnamon

## Fehlerbehebung

Falls Daten nicht laden:
1. Überprüfe Internetverbindung
2. Prüfe ob curl installiert ist: `which curl`
3. Schau Cinnamon Logs an: `journalctl -xe`

## Version

v1.10.0 - Kompaktere Karte und flüssigere Einstellungen ohne Mehrfachabfragen
