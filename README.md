# Weihnachtsessen 2026

Einladungsseite für das Weihnachtsessen zwischen den Jahren. Läuft auf GitHub Pages, die Antworten der Gäste landen in einem Google Sheet, das nur dir gehört.

## Aufbau

| Datei | Wofür |
|---|---|
| `config.js` | Alles, was du änderst: Backend-URL, Termine, finaler Termin, Ort, Menü |
| `index.html`, `assets/` | Die Seite selbst |
| `backend/Code.gs` | Das Backend (Google Apps Script) |

## Backend einrichten (einmalig, ca. 5 Minuten)

1. Neues Google Sheet anlegen, z. B. „Weihnachtsessen 2026 Antworten“.
2. Im Sheet: **Erweiterungen → Apps Script**.
3. Den Inhalt von `backend/Code.gs` komplett in den Editor kopieren (vorhandenen Code ersetzen) und speichern.
4. Oben die Funktion **`setup`** auswählen und **Ausführen**. Google fragt nach Berechtigungen: zulassen (bei „Google hat diese App nicht überprüft“ auf *Erweitert → Weiter* klicken, es ist dein eigenes Skript).
5. **Bereitstellen → Neue Bereitstellung → Typ: Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
6. Die angezeigte Web-App-URL (endet auf `/exec`) kopieren und in `config.js` bei `apiUrl` eintragen.

Wenn du `Code.gs` später änderst: **Bereitstellungen verwalten → Bearbeiten → Version: Neue Version**. Die URL bleibt gleich.

Solange `apiUrl` leer ist, läuft die Seite im Vorschau-Modus und speichert Antworten nur im eigenen Browser.

## Was wo landet

- **Öffentlich auf der Seite:** Name und Terminwahl.
- **Nur im Sheet (nur du):** Unverträglichkeiten, Nachrichten an dich, Bearbeitungs-Token.

Jeder Gast kann seine Antwort im selben Browser später ändern.

## Persönliche Links

Hänge `?fuer=Name` an, dann wird der Gast im Intro und im Brief persönlich angesprochen und sein Name ist im Formular schon eingetragen:

```
https://lucasguttensohn.github.io/weihnachtsessen-2026/?fuer=Anna
```

## Später

- **Termin steht:** in `config.js` z. B. `finalDate: "2026-12-29T19:00"` setzen. Die Abstimmung schließt, oben läuft ein Countdown, die Tafel zeigt die Zusagen für diesen Abend.
- **Menü enthüllen:** in `config.js` bei `menu` die Felder `dish`, `detail` und `wine` ausfüllen. Leere Gänge bleiben geschwärzt. Mehr Gänge = mehr Einträge.
- **Ort:** `location` ausfüllen.
