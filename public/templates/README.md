# Template-Verwendung

## 🚀 Neue DOCX-Bibliothek-Integration

Diese Anwendung verwendet jetzt die **docx-Bibliothek** anstelle von PizZip/Docxtemplater für eine stabile und bewährte DOCX-Generierung.

### Vorteile der docx-Bibliothek:
- ✅ Stabile und bewährte Lösung
- ✅ Vollständige TypeScript-Unterstützung
- ✅ Keine problematischen Abhängigkeiten
- ✅ Einfache React-Integration
- ✅ Aktive Wartung
- ✅ Unterstützt sowohl .txt als auch .docx Templates
- ✅ Keine Endlos-Loops mehr

## Verfügbare Vorlagen

### 1. Wochenbericht - Einfache Vorlage (`wochenbericht_vorlage.txt`)
Eine einfache Vorlage für wöchentliche Berichte mit:
- Grundlegenden Benutzerdaten
- Tätigkeiten für jeden Wochentag
- Arbeitszeiten
- Zusammenfassung

### 2. Wochenbericht - Erweiterte Vorlage (`wochenbericht_vorlage_erweitert.txt`)
Eine erweiterte Vorlage mit zusätzlichen Feldern:
- Alle Funktionen der einfachen Vorlage
- Ausbildungsberuf und -jahr
- Besondere Vorkommnisse
- Gelerntes
- Planung für die nächste Woche

## Verwendung

### Als Text-Datei (.txt)
Die `.txt` Dateien können direkt in der Anwendung verwendet werden. Die Platzhalter werden automatisch durch die entsprechenden Daten ersetzt und als DOCX generiert.

### Als Word-Dokument (.docx)
DOCX-Dateien werden jetzt vollständig unterstützt und direkt verarbeitet. Die Anwendung generiert ein neues DOCX-Dokument basierend auf den Template-Daten.

### Automatische Konvertierung
- **Text-Templates** → Werden zu DOCX konvertiert
- **DOCX-Templates** → Werden direkt verarbeitet
- **Keine Endlos-Loops** mehr bei der Verarbeitung

## Verfügbare Platzhalter

### Grundlegende Daten
- `{userName}` - Name des Benutzers
- `{userCompany}` - Name des Unternehmens
- `{currentDate}` - Aktuelles Datum
- `{weekNumber}` - Kalenderwoche
- `{weekYear}` - Jahr der Kalenderwoche
- `{weekDateRange}` - Datumsbereich der Woche

### Tagesdaten
- `{monday.activities}` - Liste der Montags-Tätigkeiten
- `{monday.hours}` - Montags-Arbeitszeit
- `{tuesday.activities}` - Liste der Dienstags-Tätigkeiten
- `{tuesday.hours}` - Dienstags-Arbeitszeit
- `{wednesday.activities}` - Liste der Mittwochs-Tätigkeiten
- `{wednesday.hours}` - Mittwochs-Arbeitszeit
- `{thursday.activities}` - Liste der Donnerstags-Tätigkeiten
- `{thursday.hours}` - Donnerstags-Arbeitszeit
- `{friday.activities}` - Liste der Freitags-Tätigkeiten
- `{friday.hours}` - Freitags-Arbeitszeit

### Zusammenfassung
- `{totalHours}` - Gesamtstunden der Woche
- `{avgHoursPerDay}` - Durchschnittliche Stunden pro Tag

### Erweiterte Felder (nur in erweiterter Vorlage)
- `{ausbildungsberuf}` - Ausbildungsberuf
- `{ausbildungsjahr}` - Ausbildungsjahr
- `{besondereVorkommnisse}` - Besondere Vorkommnisse
- `{gelerntes}` - Was gelernt wurde
- `{naechsteWoche}` - Planung für die nächste Woche

## Hinweise

- Alle Platzhalter werden automatisch durch die entsprechenden Daten aus der Anwendung ersetzt
- Leere Felder werden durch leere Strings ersetzt
- Listen (wie Tätigkeiten) werden automatisch als Aufzählung formatiert
- Die Vorlagen unterstützen sowohl deutsche als auch englische Datumsformate
