# GCC Atlas

A working prototype of a single, trusted source of information on India's Global Capability Centres (GCCs): which companies have them, which are coming next, where they are, which service providers have worked with them, and which city suits a new centre.

A GCC is an office a global company opens in India to run its own work, such as technology, finance or operations. India has about 2,100 of them, but sources disagree on the number and none publishes its list. GCC Atlas joins scattered public information into one list where every fact links to its source.

**Live version:** https://divyansh2992.github.io/GCC/

## Run it

No install or server is needed. Open `index.html` in any modern browser. (`gcc-atlas.html` is an identical copy, kept so older links still work.)

To host it on GitHub Pages, publish this folder from the repository's main branch. Pages serves `index.html` at the site address.

The page is a single self-contained file: the dataset, styles and code are all inside it. Fonts load from Google Fonts when you are online; without a connection the page uses system fonts.

## What you can do

| Section | What it does |
|---|---|
| Dashboard | Summary numbers, a bar chart of GCCs by city, a chart of GCC news by month, the latest news, and an Ask box. Click any number or bar to open the matching list. |
| Companies | Every company in the dataset. Search, filter by city, industry or status, sort by any column, star companies, and export to CSV. Click a row for details, sources, news, partners and your own notes. |
| News & alerts | Companies that opened, grew, moved or sold an India centre (Jan 2025 to Oct 2026). Choose what you sell and your cities; each item says why it matters to you. Unread items are counted in the sidebar. |
| Providers | 44 real service providers (brokers, recruiters, payroll, law firms, setup advisers) with the GCC clients they have public proof for, graded Official, News report or Provider's own claim. |
| City planner | Ranks cities on GCC talent, office rent and peer companies. Shows year-one rent and each state's rent support in rupees. Click a city to select it, compare up to three side by side, and read nine state GCC policies. |
| Add from news | Paste an article; the facts are extracted, matched to an existing company or flagged as new, and added when you approve. |
| My list | Your starred companies and notes, with CSV export and a button to clear your changes. |
| Search and + Add company | Search across companies, providers and cities from the top bar, or add a company by hand. |

### AI and basic mode

When an AI service is connected, the app uses it to answer questions, read pasted articles and write the city summary. Answers use only the data in the app and cite the records they rely on.

Without one (for example on GitHub Pages or as a local file), the AI is off and the badge in the sidebar says "basic mode". Every feature still works:

- Ask lists the matching records.
- Add from news reads articles with simple rules.
- The city summary is written from the planner results.

### Saving

Stars, notes, added companies and alert settings are saved in your browser's local storage. They stay after a reload, but they are not shared with anyone else who opens the page. "Clear all my changes" in My list resets them.

## Data

Everything comes from public sources collected on 25 October 2026. Each record links its source in the app.

- **Companies:** 40 established GCCs, plus 15 companies from news events in 2025–26 (new centres, expansions, leases, closures and sales to IT firms). Where no public headcount exists, the field says "not public" instead of guessing. Each headcount shows whether it came from the company, a news report or a third-party estimate.
- **Providers:** 44 firms across six categories. Only engagements with a public source are shown; deals that are not GCC client work (stakes, partnerships, government agreements) are left out.
- **Cities:** office rents from Knight Frank (H1 2026) and Cushman & Wakefield, GCC talent from Zinnov (FY24), and GCC counts by city from Vestian (2025).
- **State policies:** summaries of nine state GCC policies from the official Invest UP page and advisory-firm notes (BDO, RSM, Grant Thornton, Mondaq, Khaitan & Co).
- **Market counts:** Nasscom–Zinnov, ANSR, AIM Research, OceanFrogs and the Government of India (PIB).

The raw dataset and research notes, with every source URL, are in `../research/` (`gcc-dataset.json`, `market-facts.md`, `states-cities.md`, `competitors-feasibility.md`).

### Limits

- **Coverage:** this is a sourced sample, not the full list of about 2,100 GCCs. The production design builds the full list from company filings (MCA), licensed job data, leases and news.
- **Estimates:** rent support figures are estimates from each policy's published rule; eligibility conditions apply.
- **Verification:** some figures are marked unverified in the research notes, for example Madhya Pradesh incentives, Jaipur and Indore rents, and the reported Costco centre. Check figures against the original source before relying on them.

## Project layout

```
prototype/
├── index.html          the built app (open this; GitHub Pages serves it)
├── gcc-atlas.html      identical copy of index.html
├── build.py            rebuilds both pages from src/ and the dataset
└── src/
    ├── shell.part.html styles and page layout
    ├── data.part.js    reference data (cities, policies, counts) and dataset loading
    └── app.part.js     app logic: navigation, views, saving, export, AI and fallbacks
```

## Rebuild after changes

Edit the files in `src/` (or the dataset in `../research/gcc-dataset.json`), then run:

```bash
python build.py
```

This embeds the dataset into the page and writes fresh `index.html` and `gcc-atlas.html`. It needs Python 3 and no other packages.
