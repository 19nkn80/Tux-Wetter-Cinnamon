# TuX-Wetter für Cinnamon

TuX-Wetter ist ein deutschsprachiges Wetter-Desklet für Cinnamon. Es zeigt
aktuelle Wetterdaten, Stunden- und Tagesprognosen, mehrere gespeicherte Orte,
Wetterwarnungen sowie optionale Luftqualitäts-, Pollen- und Monddaten.

## Voraussetzungen

- Linux mit **Cinnamon 6.6 oder neuer**
- funktionierendes Internet
- `curl`
- ein Wetterdienst ohne Registrierung:
  - Open-Meteo (Standard)
  - wttr.in
  - MET Norway / yr.no

Es wird kein API-Schlüssel und kein Benutzerkonto benötigt. `GJS`, `GLib`,
`Gio`, `Clutter` und `St` werden von Cinnamon bereitgestellt und müssen nicht
separat installiert werden.

`curl` prüfen:

```bash
command -v curl
```

Falls der Befehl fehlt:

```bash
sudo apt update
sudo apt install curl
```

## Installation über die Cinnamon-Oberfläche

1. Lade `Tux-Wetter-Cinnamon-1.17.0.zip` herunter.
2. Öffne **Systemeinstellungen → Desklets**.
3. Öffne das Menü **Hinzufügen** beziehungsweise **Aus Datei installieren**.
4. Wähle die ZIP-Datei aus.
5. Suche in der Liste nach **TuX-Wetter** und füge es mit **+** zum Desktop hinzu.
6. Öffne das Zahnrad am Desklet, um Standort und Anzeige einzurichten.

Das ZIP enthält bereits den erforderlichen Ordner
`tux-wetter@cinnamon-desklet`. Die ZIP-Datei darf nicht vorher entpackt
werden, wenn sie über den Desklet-Manager importiert wird.

## Manuelle Installation

Wenn deine Cinnamon-Version keinen Dateiimport anbietet:

```bash
mkdir -p ~/.local/share/cinnamon/desklets
unzip Tux-Wetter-Cinnamon-1.17.0.zip -d ~/.local/share/cinnamon/desklets
```

Danach **Systemeinstellungen → Desklets** öffnen, TuX-Wetter aktivieren und
auf dem Desktop platzieren.

## Erste Einrichtung

1. Öffne das Zahnrad am Desklet.
2. Suche unter **Standort suchen** nach einem Ort oder trage
   `Breitengrad,Längengrad` ein.
3. Speichere mehrere Orte in der Ortsliste.
4. Wähle den Wetterdienst und das Farbthema.
5. Klicke unten auf **Speichern und übernehmen**.
6. Mit **Abbrechen** werden die zuletzt übernommenen Einstellungen
   wiederhergestellt.

Die Pfeile neben dem Ortsnamen wechseln zwischen gespeicherten Orten.
Zusätzlich funktionieren Mausrad und rechte Maustaste am Desklet.

## Funktionen

- aktuelle Temperatur, Gefühlte Temperatur und Wetterbeschreibung
- sechs Stundenwerte und fünf Tageswerte
- Windrichtung, Windgeschwindigkeit, Feuchtigkeit, Druck und UV-Index
- Regenwahrscheinlichkeit und Sonnenaufgang/-untergang
- mehrere Orte mit schneller Umschaltung
- Open-Meteo, wttr.in und MET Norway / yr.no
- DWD- und GeoSphere-Austria-Warnungen
- Luftqualität, Pollen und Mondphase/-zeiten
- native Clutter-Farbflächen ohne HTML, CSS-Gradienten oder Cairo
- skalierbare Kartengröße und einstellbare Hintergrunddeckkraft

## Aktualisierung

Über das Kontextmenü des Desklets kann nach GitHub-Updates gesucht werden.
Alternativ kann die neue ZIP-Datei heruntergeladen und erneut über den
Desklet-Manager importiert werden.

## Fehlerbehebung

### Das Desklet erscheint nicht

Prüfe, ob der UUID-Ordner exakt so heißt:

```text
tux-wetter@cinnamon-desklet
```

Desklets neu laden:

```bash
cinnamon --replace &
```

### Es werden keine Daten angezeigt

Prüfe Internet und `curl`:

```bash
curl -I https://api.open-meteo.com
```

Cinnamon-Fehler ansehen:

```bash
journalctl --user -b --no-pager | grep -i cinnamon
```

### Einstellungen oder Darstellung sind veraltet

Entferne das Desklet vom Desktop, lade es im Desklet-Manager neu und füge es
wieder hinzu. Die persönlichen Einstellungen liegen getrennt vom Paket unter
`~/.config/cinnamon/spices/tux-wetter@cinnamon-desklet/`.

## Entwicklung

Die drei Paketdateien sind:

- `desklet.js`
- `metadata.json`
- `settings-schema.json`

Das Projekt ist auf GitHub verfügbar:

<https://github.com/19nkn80/Tux-Wetter-Cinnamon>
