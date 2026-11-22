# BrokerHub

BrokerHub is a React and Vite frontend for researching and comparing brokerage
providers. The current workspace contains the frontend only; the Express,
Prisma, and PostgreSQL services described in the project brief are not present
here yet.

## Project structure

```text
src/
  components/
    layout/          Navbar and Footer
    BrokerCard.jsx
    BrokerMark.jsx
    FilterSheet.jsx
    SiteLayout.jsx
  context/
    CompareContext.jsx
    CompareStore.js
    useCompare.js
  data/
    brokers.js       Illustrative local broker data for the UI
  lib/
    apiClient.js     Axios client for the future API integration
  pages/
    HomePage.jsx
    BrokersPage.jsx
    BrokerDetailPage.jsx
    ComparePage.jsx
    RankingsPage.jsx
    NotFoundPage.jsx
  App.jsx
  index.css
  main.jsx
```

## Development

```sh
npm install
npm run dev
npm run lint
npm run build
```

## Frontend routes

- `/` — Home and broker search
- `/brokers` — Searchable, filterable, sortable broker directory
- `/brokers/:slug` — Broker overview and score breakdown
- `/compare` — Compare up to three saved brokers
- `/best-brokers` — Broker rankings and scoring methodology

Directory filters and search are synchronized with URL query parameters. The
comparison selection is saved in browser local storage.

## Data and API status

The UI currently uses a small illustrative dataset in `src/data/brokers.js`;
its scores, fees, and other details are not live or independently verified.
Replace this local source with the broker API before publishing broker claims.
The Axios client uses `/api` by default and supports setting `VITE_API_BASE_URL`.
No API server, Prisma schema, or database setup is included in this workspace.

The ranking example applies the documented formula: trust (35%), fees (25%),
markets (20%), support (10%), and platforms (10%).
