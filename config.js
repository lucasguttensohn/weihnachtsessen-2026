/*
  Weihnachtsessen 2026 · Konfiguration
  Alles, was du regelmäßig änderst, steht hier. Die restlichen Dateien musst du nicht anfassen.
*/
window.WE_CONFIG = {
  // URL deiner Google-Apps-Script-Web-App (siehe README). Leer = Demo-Modus, nichts wird gespeichert.
  apiUrl: "",

  host: "Lucas",

  // Kandidaten für den Abend (ISO-Datum). Die Wochentage berechnet die Seite selbst.
  dates: [
    "2026-12-28",
    "2026-12-29",
    "2026-12-30"
  ],

  // Bis wann abgestimmt werden soll.
  voteDeadline: "2026-11-15",

  // Sobald der Termin steht: z. B. "2026-12-12T19:00". Dann schließt die Abstimmung und ein Countdown erscheint.
  finalDate: "",

  // Plätze an der Tafel (ohne Gastgeber).
  seats: 12,

  // Ort. Leer lassen, solange er geheim bleiben soll.
  location: "",

  // Das Menü. Leere Felder bleiben geschwärzt. Zum Enthüllen einfach ausfüllen.
  menu: [
    { dish: "", detail: "", wine: "" },
    { dish: "", detail: "", wine: "" },
    { dish: "", detail: "", wine: "" },
    { dish: "", detail: "", wine: "" }
  ]
};
