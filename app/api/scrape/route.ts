import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'
import OpenAI from 'openai'

export const maxDuration = 60 // Set function timeout to 60 seconds

type Event = {
  venue: string
  eventName: string
  date: string
  time: string
  price?: string
  description?: string
  url: string
}

async function scrapeWebsite(url: string): Promise<{ content: string; screenshot: string }> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  })

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 }
    })
    const page = await context.newPage()
    
    // Set timeout and navigate
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })

    // Wait longer for dynamic content to load
    await page.waitForTimeout(5000)

    // Scroll down to trigger lazy loading
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let totalHeight = 0
        const distance = 100
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance

          if (totalHeight >= scrollHeight) {
            clearInterval(timer)
            // Scroll back to top
            window.scrollTo(0, 0)
            setTimeout(resolve, 1000)
          }
        }, 100)
      })
    })

    // Get the page content
    const content = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, noscript')
      scripts.forEach(el => el.remove())

      // Get text content with some structure preserved
      const getTextWithStructure = (element: Element): string => {
        let text = ''
        
        // Add newlines for block elements
        const blockElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'article', 'section']
        
        for (const child of element.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            const nodeText = child.textContent?.trim()
            if (nodeText) {
              text += nodeText + ' '
            }
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const elem = child as Element
            const tagName = elem.tagName.toLowerCase()
            
            if (blockElements.includes(tagName)) {
              text += '\n'
            }
            
            text += getTextWithStructure(elem)
            
            if (blockElements.includes(tagName)) {
              text += '\n'
            }
          }
        }
        
        return text
      }

      // Try to find event-related sections
      const eventKeywords = ['events', 'calendar', 'shows', 'concerts', 'schedule', 'upcoming', 'performances', 'gigs']
      let eventContent = ''

      // Look for sections with event-related keywords
      for (const keyword of eventKeywords) {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.toLowerCase() || ''
          const className = el.className?.toString().toLowerCase() || ''
          const id = el.id?.toLowerCase() || ''
          return text.includes(keyword) || className.includes(keyword) || id.includes(keyword)
        })

        for (const el of elements) {
          if (el.textContent && el.textContent.length > 50) {
            eventContent += getTextWithStructure(el) + '\n\n'
          }
        }
      }

      // If no specific event sections found, get the main content
      if (!eventContent) {
        const main = document.querySelector('main') || document.body
        eventContent = getTextWithStructure(main)
      }

      // Also get any structured data
      const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(script => script.textContent)
        .filter(Boolean)
        .join('\n\n')

      return `URL: ${window.location.href}\n\nSTRUCTURED DATA:\n${structuredData}\n\nPAGE CONTENT:\n${eventContent}`
    })

    // Take a full-page screenshot
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'jpeg',
      quality: 80
    })

    return {
      content,
      screenshot: screenshot.toString('base64')
    }
  } finally {
    await browser.close()
  }
}

async function extractEventsWithGPT(content: string, screenshot: string, url: string, openai: OpenAI): Promise<Event[]> {
  const systemPrompt = `You are an expert at extracting music event information from website content and screenshots. 
  Extract all upcoming music events, concerts, shows, or performances from the provided content and screenshot.
  
  For each event, extract:
  - venue: The name of the venue (derive from the URL or content if not explicitly stated)
  - eventName: The name of the event, band, artist, or show
  - date: The date in a readable format (e.g., "March 15, 2024" or "3/15/2024")
  - time: The time of the event (e.g., "8:00 PM" or "20:00")
  - price: The ticket price if available (e.g., "$25" or "Free")
  - description: A brief description if available
  - url: The URL to the specific event page if mentioned, otherwise use the provided base URL

  Use both the text content AND the screenshot to find events. Screenshots can show calendars, event listings, 
  and visual information that might not be captured in the text. Look for dates, times, band names, and event details
  in both sources.

  Return the data as a JSON object with an "events" key containing an array of event objects. 
  If no events are found, return {"events": []}.
  Only include events that are clearly in the future (from today onwards).
  If the date year is not specified, assume it's the current or next year based on context.`

  const userPrompt = `Extract all upcoming music events from this website. I'm providing both the text content and a screenshot of the page.

Text Content:
${content}

Base URL: ${url}

Please analyze both the text and the screenshot to find all upcoming music events.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            {
              type: 'text',
              text: userPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${screenshot}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const result = response.choices[0].message.content
    if (!result) return []

    const parsed = JSON.parse(result)
    const events = parsed.events || parsed.data || []

    // Ensure each event has the required fields and URL
    return events.map((event: any) => ({
      venue: event.venue || new URL(url).hostname.replace('www.', ''),
      eventName: event.eventName || event.name || event.title || 'Unknown Event',
      date: event.date || 'TBA',
      time: event.time || 'TBA',
      price: event.price,
      description: event.description,
      url: event.url || url
    }))
  } catch (error) {
    console.error('Error parsing GPT response:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { urls, apiKey } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is required' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    const allEvents: Event[] = []

    for (const url of urls) {
      try {
        console.log(`Scraping ${url}...`)
        
        // Scrape the website
        const { content, screenshot } = await scrapeWebsite(url)
        
        // Extract events using GPT
        const events = await extractEventsWithGPT(content, screenshot, url, openai)
        
        allEvents.push(...events)
      } catch (error) {
        console.error(`Error processing ${url}:`, error)
        // Continue with other URLs even if one fails
      }
    }

    // Sort events by date (assuming dates can be parsed)
    allEvents.sort((a, b) => {
      try {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      } catch {
        return 0
      }
    })

    return NextResponse.json({ events: allEvents })
  } catch (error) {
    console.error('Error in scrape API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
} 