# TuX-Wetter für Cinnamon

TuX-Wetter ist ein deutschsprachiges Wetter-Desklet für Cinnamon. Es zeigt
aktuelle Wetterdaten, Stunden- und Tagesprognosen, mehrere gespeicherte Orte,
Wetterwarnungen sowie optionale Luftqualitäts-, Pollen- und Monddaten.

**TuX-Wetter 0.x ist ein Fork von Tux-Wetter-KDE von
[Mastertac](https://github.com/Mastertac2000/tux-wetter/releases).**

## Version 0.5

- Einheitliche Schriftgröße und anklickbarer Verweis auf Mastertac.
- Updates kommen aus dem festen Ordner `latest-release`; das ZIP bleibt versioniert.

## Voraussetzungen

- Linux mit **Cinnamon 6.6.x**
- getestet mit **Linux Mint 22.3 und Cinnamon 6.6.9** sowie LMDE 7
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

1. Lade `Tux-Wetter-Cinnamon-0.5.zip` herunter.
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
unzip Tux-Wetter-Cinnamon-0.5.zip -d ~/.local/share/cinnamon/desklets
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
In den Optionen gibt es zusätzlich **Auf Updates prüfen**. Wenn GitHub eine
höhere Version meldet, erscheint zuerst ein Hinweis und danach ein Dialog mit
**Updaten** und **Abbrechen**. Beim Updaten werden die drei Desklet-Dateien
aus `latest-release` im GitHub-Zweig `main` geladen. Cinnamon muss anschließend neu geladen
werden.

Beim Start prüft das Desklet automatisch, ob auf GitHub eine neuere Version
vorliegt. Die aktuell installierte Version wird oben im Desklet angezeigt.
Version 0.4 verwendet noch den alten Updatepfad und muss einmalig manuell auf
0.5 aktualisiert werden. Persönliche Desklet-Einstellungen bleiben erhalten.
Dies hilft auch, wenn eine spätere Aktualisierung nicht funktioniert:

```bash
curl -fL https://github.com/19nkn80/Tux-Wetter-Cinnamon/archive/refs/heads/main.zip \
  -o /tmp/tux-wetter-main.zip
unzip -o /tmp/tux-wetter-main.zip -d /tmp
mkdir -p ~/.local/share/cinnamon/desklets/tux-wetter@cinnamon-desklet
cp /tmp/Tux-Wetter-Cinnamon-main/latest-release/{desklet.js,metadata.json,settings-schema.json} \
  ~/.local/share/cinnamon/desklets/tux-wetter@cinnamon-desklet/
cinnamon --replace &
```

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

### Die 5-Tage-Übersicht zeigt falsche Wetterwerte oder Wochentage

Die Liste enthält nur die fünf Tage ab morgen. „Heute“ steht bereits im
aktuellen Wetterbereich oben im Desklet. Die Wochentage werden anhand des
Systemdatums berechnet. Prüfe, ob die Versionsanzeige **TuX-Wetter 0.5**
meldet. Lade Cinnamon neu, falls die Anzeige nach der Aktualisierung noch
veraltet aussieht. In Version 0.5 können die Wetterwerte weiterhin um einen
Tag gegenüber den Wochentagen versetzt sein.

### Die Updateprüfung findet kein Update oder das Update schlägt fehl

Prüfe die Internetverbindung und ob `curl` sowie `unzip` verfügbar sind.
Installiere die Desklet-Dateien andernfalls wie im Abschnitt
[Aktualisierung](#aktualisierung) beschrieben manuell:

```bash
command -v curl
command -v unzip
curl -I https://github.com
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

Für jede Veröffentlichung müssen diese drei Dateien auch im Ordner
`latest-release` aktualisiert werden. Das Installations-ZIP trägt weiterhin
die jeweilige Versionsnummer.

Das Projekt ist auf GitHub verfügbar:

<https://github.com/19nkn80/Tux-Wetter-Cinnamon>
