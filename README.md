# TuX-Wetter für Cinnamon

TuX-Wetter ist ein deutschsprachiges Wetter-Desklet für Cinnamon. Es zeigt
aktuelle Wetterdaten, Stunden- und Tagesprognosen, mehrere gespeicherte Orte,
Wetterwarnungen sowie optionale Luftqualitäts-, Pollen- und Monddaten.

**TuX-Wetter 0.x ist ein Fork von Tux-Wetter-KDE von Mastertac.**

## Version 0.4

- Die Tagesübersicht listet die fünf Wochentage ab morgen; der aktuelle Tag
  wird bereits oben im Desklet angezeigt.
- Die Wochentage werden dynamisch berechnet und vollständig ausgeschrieben.
- Die Spalte für Tagesnamen ist verbreitert, damit auch „Donnerstag“ lesbar ist.
- Das Verschiebeschloss und die Optionen zum Sperren und Entsperren bleiben
  verfügbar.

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

1. Lade `Tux-Wetter-Cinnamon-0.3.zip` herunter.
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
unzip Tux-Wetter-Cinnamon-0.3.zip -d ~/.local/share/cinnamon/desklets
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
aus dem GitHub-Updatezweig geladen. Cinnamon muss anschließend neu geladen
werden.

Beim Start prüft das Desklet automatisch, ob auf GitHub eine neuere Version
vorliegt. Die aktuell installierte Version wird oben im Desklet angezeigt.

### Bekannter Fehler in Version 0.4

Der Updater von Version 0.4 fragt noch den Git-Tag `v0.3` ab. Dieser enthält
weiterhin Version 0.3; dadurch kann Version 0.4 ein Update nicht erkennen.
Das betrifft Mint 22.3 ebenso wie andere Distributionen mit Cinnamon 6.6 und
ist kein spezielles Mint-Problem.

Bis der Updater in einer neueren Version korrigiert ist, installiere die
aktuellen Dateien manuell. Das ersetzt keine persönlichen Desklet-Einstellungen:

```bash
curl -fL https://github.com/19nkn80/Tux-Wetter-Cinnamon/archive/refs/heads/main.zip \
  -o /tmp/tux-wetter-main.zip
unzip -o /tmp/tux-wetter-main.zip -d /tmp
mkdir -p ~/.local/share/cinnamon/desklets/tux-wetter@cinnamon-desklet
cp /tmp/Tux-Wetter-Cinnamon-main/{desklet.js,metadata.json,settings-schema.json} \
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

### Die 5-Tage-Übersicht zeigt „Heute“, falsche Tage oder abgeschnittene Namen

Die Liste enthält nur die fünf Tage ab morgen. „Heute“ steht bereits im
aktuellen Wetterbereich oben im Desklet. Die Wochentage werden anhand des
Systemdatums berechnet. Prüfe, ob die Versionsanzeige **TuX-Wetter 0.4**
meldet. Bei einer älteren Installation werden die Änderungen der
5-Tage-Ansicht noch nicht verwendet. Aktualisiere die Dateien manuell wie im
Abschnitt [Aktualisierung](#aktualisierung) beschrieben und lade Cinnamon neu.

**Bekannter Fehler in Version 0.4:** Wenn die Wochentagsnamen stimmen, die
angezeigten Wetterwerte aber zum vorherigen Tag gehören, liegt das an einer
versetzten Zuordnung der Vorhersagedaten. Das ist kein Mint-22.3-Problem.
Eine erneute Installation derselben Version 0.4 behebt es nicht; dafür ist
eine korrigierte Desklet-Version erforderlich.

### Die Updateprüfung findet kein Update oder das Update schlägt fehl

In Version 0.4 ist die automatische Updateprüfung wegen des veralteten
Update-Tags nicht zuverlässig; siehe [Bekannter Fehler in Version
0.4](#bekannter-fehler-in-version-04). Installiere die aktuellen Dateien
manuell über den dort beschriebenen Weg. Bei manuellen Netzwerkfehlern prüfe
die Verbindung und ob `curl` sowie `unzip` verfügbar sind:

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

Das Projekt ist auf GitHub verfügbar:

<https://github.com/19nkn80/Tux-Wetter-Cinnamon>
