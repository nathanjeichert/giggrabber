# Music Events Scraper

A full-stack Next.js application that scrapes music venue websites and uses OpenAI's GPT-4o mini to intelligently extract upcoming event information.

## Features

- **URL List Management**: Create and manage multiple lists of venue/band websites
- **Intelligent Scraping**: Uses Playwright for robust web scraping
- **AI-Powered Extraction**: Leverages GPT-4o mini to parse complex website structures
- **Event Organization**: Displays extracted events in a clean, sortable table
- **Persistent Storage**: Saves your URL lists and API key locally
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+ installed
- An OpenAI API key with access to GPT-4o mini
- A Vercel account for deployment

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd music-events-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install chromium
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Usage

1. **Add your OpenAI API Key**: 
   - Enter your API key in the provided field
   - The key is saved locally in your browser

2. **Create a URL List**:
   - Enter a name for your list (e.g., "Local Venues", "Favorite Bands")
   - Click "Create List"

3. **Add URLs**:
   - Select a list from the sidebar
   - Add venue or band website URLs
   - Examples:
     - `https://www.boweryballroom.com/`
     - `https://www.bluenote.net/newyork/`
     - `https://www.msg.com/calendar`

4. **Scrape Events**:
   - Click "Scrape Events" to extract upcoming shows
   - The app will process each URL and display results in a table

## Deployment to Vercel

### Method 1: Deploy with Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link to your Vercel account

### Method 2: Deploy via GitHub

1. Push your code to a GitHub repository

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "New Project" and import your GitHub repository

4. Configure build settings (should auto-detect Next.js)

5. Deploy!

### Important Deployment Notes

- **Playwright on Vercel**: The app uses Playwright for web scraping. Vercel's serverless functions support Playwright, but:
  - Function timeout is set to 60 seconds
  - Each URL is scraped sequentially to avoid timeouts
  - Consider using Vercel Pro for longer timeouts if needed

- **Environment Variables**: 
  - The app stores the OpenAI API key in browser localStorage
  - No server-side environment variables are needed

## Architecture

```
music-events-scraper/
├── app/
│   ├── page.tsx          # Main UI component
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Global styles
│   └── api/
│       └── scrape/
│           └── route.ts  # Scraping API endpoint
├── public/               # Static assets
├── package.json          # Dependencies
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## How It Works

1. **Frontend (app/page.tsx)**:
   - Manages URL lists using React state
   - Persists data in localStorage
   - Sends scraping requests to the API

2. **API Route (app/api/scrape/route.ts)**:
   - Receives URLs and API key
   - Uses Playwright to scrape each website
   - Extracts text content while preserving structure
   - Sends content to GPT-4o mini for event extraction
   - Returns structured event data

3. **AI Extraction**:
   - GPT-4o mini analyzes the scraped content
   - Identifies events, dates, times, and prices
   - Handles various website formats and structures
   - Returns JSON-formatted event data

## Customization

### Adding More Event Fields

Edit the `Event` type in both `app/page.tsx` and `app/api/scrape/route.ts`:

```typescript
type Event = {
  venue: string
  eventName: string
  date: string
  time: string
  price?: string
  description?: string
  ticketLink?: string  // New field
  genre?: string       // New field
  url: string
}
```

Then update the GPT prompt in `extractEventsWithGPT` to extract these fields.

### Improving Scraping

Modify the `scrapeWebsite` function to:
- Wait for specific elements
- Handle login-protected content
- Extract images or other media
- Follow pagination links

### Styling

The app uses Tailwind CSS. Customize the design by:
- Modifying color schemes in `tailwind.config.js`
- Updating component styles in `app/page.tsx`
- Adding custom CSS in `app/globals.css`

## Limitations

- **Rate Limits**: Be mindful of OpenAI API rate limits
- **Scraping Ethics**: Only scrape websites you have permission to access
- **Dynamic Content**: Some heavily JavaScript-based sites may require additional handling
- **Timeout**: Vercel functions have a maximum timeout (60s for free tier)

## Troubleshooting

### "Function timed out" Error
- Reduce the number of URLs being scraped at once
- Upgrade to Vercel Pro for longer timeouts
- Implement pagination to scrape URLs in batches

### No Events Found
- Check if the website uses JavaScript rendering
- Inspect the GPT prompt for the specific website structure
- Add more wait time in the scraping function

### Deployment Fails
- Ensure all dependencies are in `package.json`
- Check Vercel function logs for specific errors
- Verify Playwright is properly configured in `next.config.js`

## Contributing

Feel free to submit issues and pull requests to improve the scraper!

## License

MIT License - feel free to use this project for your own music discovery!