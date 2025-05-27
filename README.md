# Music Events Scraper

A Next.js application that scrapes music venue websites to extract upcoming events and concerts using AI-powered content analysis.

## Features

- **URL List Management**: Create and manage lists of venue websites
- **AI-Powered Scraping**: Uses OpenAI GPT to intelligently extract event information
- **Event Display**: Clean, organized table view of upcoming events
- **Local Storage**: Saves your URL lists and API key locally
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

1. **Create URL Lists**: Organize venue websites into named lists
2. **Add Venue URLs**: Add music venue websites to your lists
3. **Scrape Events**: The app uses Playwright to scrape website content and OpenAI to extract event details
4. **View Results**: See all upcoming events in a clean, sortable table

## Setup

### Prerequisites

- Node.js 18+ 
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd music-events-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install chromium --with-deps
```

4. Create a `.env.local` file:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating URL Lists

1. Enter a name for your list (e.g., "Local Venues", "Jazz Clubs")
2. Click "Create List"
3. Select the list to start adding URLs

### Adding Venue URLs

1. Select a list from the left sidebar
2. Enter a venue website URL
3. Click "Add URL"
4. Repeat for all venues you want to track

### Scraping Events

1. Make sure you have an OpenAI API key entered
2. Select a list with URLs
3. Click "Scrape Events"
4. Wait for the AI to analyze the websites and extract event information

### Viewing Events

Events are displayed in a table with:
- Venue name
- Event/artist name
- Date and time
- Ticket price (if available)
- Link to the original event page

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `OPENAI_API_KEY` environment variable in Vercel dashboard
4. Deploy!

The app includes a `vercel.json` configuration that:
- Sets up Playwright for the scraping function
- Configures longer timeout for the scraping API
- Optimizes the build process

### Other Platforms

The app can be deployed to any platform that supports Next.js and can run Playwright:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

Make sure to:
1. Install Playwright dependencies
2. Set the `OPENAI_API_KEY` environment variable
3. Configure any necessary timeout settings for the scraping function

## Technical Details

### Architecture

- **Frontend**: Next.js 14 with React and TypeScript
- **Styling**: Tailwind CSS
- **Scraping**: Playwright for web scraping
- **AI**: OpenAI GPT-4 for content analysis
- **Storage**: Browser localStorage for URL lists

### API Endpoints

- `POST /api/scrape`: Scrapes provided URLs and returns extracted events

### Data Flow

1. User provides venue URLs and OpenAI API key
2. Playwright navigates to each URL and extracts page content
3. Content is sent to OpenAI GPT for event extraction
4. Structured event data is returned and displayed

## Limitations

- Requires OpenAI API key (paid service)
- Some websites may block automated scraping
- Event extraction accuracy depends on website structure and content
- Rate limited by OpenAI API usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 