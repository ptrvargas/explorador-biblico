# V2.0 checkpoint — sources integrated, not deployed

Continue from source commit 1b7e312; this update extends the existing V2 draft.
The public site remains V1.4. The user explicitly forbids publishing V2 yet.

## Approved sources integrated

Both complete source banks are stored unmodified in scripts/approved-sources.
Their parsed cards are dist/banks/master-es.json and master-en.json. Each contains
100 cards with distribution 30/28/24/18, BIB-001–BIB-100, and corresponding types
and point values. Every question, option, answer, reference and explanation was
checked against the supplied text. Canonical internal type names are normalized;
no question or answer was regenerated or translated.

The universal prompt in dist/downloads/Prompt_Generador_Banco.txt is byte-identical
to the approved attachment. Downloading the AI kit includes that exact file plus
the ES or EN template under the required Plantilla_Banco_Explorador.xlsx filename.
Approved-source hashes are retained in scripts/approved-source-hashes.json.

## Regression checks passed

- node test-v2.cjs: integrated 100-card banks, ES/EN selection, actual 2/4/8-team
  setup and animated draw, scoring, 20-second deadlines, timeout recycling,
  late clicks, bonus, fair-round finishing, equal-opportunity tiebreaker, saved
  state and V1 migration, empty categories, whole-card movement on both axes,
  and automatic validation/scoring for all 200 language-specific cards.
- node test-audio.cjs: unchanged background audio, suspense, applause and mute.
- node test-workbook.cjs: real ES/EN XLSX, 1000-card roundtrip, empty category,
  malformed ZIP/missing sheets/formulas, failed storage preserving active bank,
  and AI kit contents byte-for-byte in both languages.
- node test-storage-pwa.cjs: IndexedDB activate/read/restore, language independence,
  offline navigation/cache and all required local assets and standalone icons.
- node scripts/check-release.cjs: full approved-source fidelity, 100-card counts,
  distribution, IDs, valid correct answers and references, exact universal prompt.

## Pending visual/browser QA — do not call V2 finished

The managed static checkout has no compatible supervised preview server, available
control-browser skill or installed browser executable. No real browser visual or
physical-device testing could be performed. This is a technical QA limitation,
not a request to publish despite missing QA.

Before completion, visually review desktop 1920x1080/1280x720, tablet/iPad and
mobile portrait/landscape; 2/4/8 teams; every gameplay screen, ES/EN, bank tools,
dialogs and answer layouts; confirm no unintended horizontal overflow. Rotate
during a running question and check scores/turn/deadline remain unchanged. Verify
installation on supported Android, iOS instructions, standalone and offline in
a real browser. Full underlying game and XLSX tests already passed.

Existing architecture, audio and approved exploration identity are preserved.
Mixed text/emoji cards now separate the textual prompt from the large emoji line
without changing their source content. Rankings for 5–8 teams use two columns
on desktop and one on phones, with whole-card movement across both axes.
Do not rebuild or revert this draft; complete the pending browser QA when the
required preview infrastructure is available. Do not deploy without a new user
instruction authorizing publication.
