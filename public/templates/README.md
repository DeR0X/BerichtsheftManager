# Vorlagen für Wochenberichte

Dieser Ordner enthält Vorlagen für die Generierung von Wochenberichten.

## Verfügbare Vorlagen

### 1. Word-Vorlage (DOCX)
- **Datei:** `wochenbericht_vorlage.docx`
- **Beschreibung:** Word-Vorlage für Wochenberichte - wird mit Daten gefüllt
- **Verwendung:** Für flexible, anpassbare Wochenberichte
- **Features:** 
  - Automatische Datenfüllung
  - Tätigkeiten nach Tagen
  - Stundenberechnung
  - Export als DOCX oder PDF

### 2. PDF-Vorlage
- **Datei:** `berichtsheft_vorlage_mehrere_taetigkeiten.pdf`
- **Beschreibung:** Professionelle PDF-Vorlage für Wochenberichte
- **Verwendung:** Für die meisten Wochenberichte geeignet

### 3. Standard-Vorlagen
- **Standard Wochenbericht:** Standard-Vorlage für Wochenberichte
- **Detaillierter Wochenbericht:** Erweiterte Vorlage mit mehr Details

## Word-Vorlage Verwendung

### Verfügbare Platzhalter:

**Hinweis:** docxtemplater verwendet einfache Platzhalter ohne geschweifte Klammern.

#### Benutzerdaten:
- `userName` - Name des Auszubildenden
- `userCompany` - Unternehmen (falls vorhanden)
- `currentDate` - Aktuelles Datum

#### Berichtsdaten:
- `weekNumber` - Kalenderwoche
- `weekYear` - Jahr
- `weekDateRange` - Datumsbereich der Woche

#### Tätigkeiten nach Tagen:
- `monday.activities` - Tätigkeiten am Montag (Array)
- `monday.hours` - Stunden am Montag
- `tuesday.activities` - Tätigkeiten am Dienstag (Array)
- `tuesday.hours` - Stunden am Dienstag
- `wednesday.activities` - Tätigkeiten am Mittwoch (Array)
- `wednesday.hours` - Stunden am Mittwoch
- `thursday.activities` - Tätigkeiten am Donnerstag (Array)
- `thursday.hours` - Stunden am Donnerstag
- `friday.activities` - Tätigkeiten am Freitag (Array)
- `friday.hours` - Stunden am Freitag

#### Zusammenfassung:
- `totalHours` - Gesamtstunden der Woche
- `avgHoursPerDay` - Durchschnittsstunden pro Tag

### Beispiel Word-Vorlage:

```
Wochenbericht KW {weekNumber}/{weekYear}
Name: {userName}
Unternehmen: {userCompany}
Datum: {currentDate}
Zeitraum: {weekDateRange}

Montag:
Tätigkeiten: {#monday.activities}
- {.}
{/monday.activities}
Stunden: {monday.hours}h

Dienstag:
Tätigkeiten: {#tuesday.activities}
- {.}
{/tuesday.activities}
Stunden: {tuesday.hours}h

...

Gesamtstunden: {totalHours}h
Durchschnitt pro Tag: {avgHoursPerDay}h
```

### Schleifen für Tätigkeiten:

Für mehrere Tätigkeiten pro Tag verwenden Sie Schleifen:

```
{#monday.activities}
- {.}
{/monday.activities}
```

- `{#monday.activities}` - Startet die Schleife
- `{.}` - Aktuelle Tätigkeit
- `{/monday.activities}` - Beendet die Schleife

## Hinweise

- **Word-Vorlagen:** Verwenden Sie die Platzhalter in doppelten geschweiften Klammern `{{}}`
- **PDF-Vorlagen:** Verwenden Sie die definierten Formularfelder
- **Alle Vorlagen:** Sollten im A4-Format vorliegen
- **Testen:** Testen Sie die Vorlagen vor dem Einsatz

## Anpassung

Um eigene Vorlagen hinzuzufügen:
1. **Word-Vorlage:** DOCX-Datei mit Platzhaltern in diesen Ordner legen
2. **PDF-Vorlage:** PDF-Datei mit Formularfeldern in diesen Ordner legen
3. **Registrierung:** Die Vorlage in `src/utils/pdfGenerator.ts` registrieren
4. **UI:** Die Vorlage in der Anwendung verfügbar machen
