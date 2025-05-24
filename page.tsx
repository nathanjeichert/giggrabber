// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

type URLList = {
  id: string
  name: string
  urls: string[]
  createdAt: Date
}

type Event = {
  venue: string
  eventName: string
  date: string
  time: string
  price?: string
  description?: string
  url: string
}

export default function Home() {
  const [lists, setLists] = useState<URLList[]>([])
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [newListName, setNewListName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    const savedLists = localStorage.getItem('musicVenueLists')
    const savedApiKey = localStorage.getItem('openaiApiKey')
    if (savedLists) {
      setLists(JSON.parse(savedLists))
    }
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  // Save lists to localStorage
  useEffect(() => {
    localStorage.setItem('musicVenueLists', JSON.stringify(lists))
  }, [lists])

  // Save API key to localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openaiApiKey', apiKey)
    }
  }, [apiKey])

  const createNewList = () => {
    if (!newListName.trim()) return
    
    const newList: URLList = {
      id: uuidv4(),
      name: newListName,
      urls: [],
      createdAt: new Date()
    }
    
    setLists([...lists, newList])
    setNewListName('')
    setSelectedListId(newList.id)
  }

  const deleteList = (id: string) => {
    setLists(lists.filter(list => list.id !== id))
    if (selectedListId === id) {
      setSelectedListId('')
    }
  }

  const addUrlToList = () => {
    if (!newUrl.trim() || !selectedListId) return
    
    setLists(lists.map(list => 
      list.id === selectedListId 
        ? { ...list, urls: [...list.urls, newUrl] }
        : list
    ))
    setNewUrl('')
  }

  const removeUrlFromList = (url: string) => {
    setLists(lists.map(list => 
      list.id === selectedListId 
        ? { ...list, urls: list.urls.filter(u => u !== url) }
        : list
    ))
  }

  const scrapeEvents = async () => {
    if (!selectedListId || !apiKey) {
      setError('Please select a list and provide an OpenAI API key')
      return
    }

    const selectedList = lists.find(list => list.id === selectedListId)
    if (!selectedList || selectedList.urls.length === 0) {
      setError('Selected list has no URLs')
      return
    }

    setLoading(true)
    setError(null)
    setEvents([])

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: selectedList.urls,
          apiKey: apiKey
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setEvents(data.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while scraping')
    } finally {
      setLoading(false)
    }
  }

  const selectedList = lists.find(list => list.id === selectedListId)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Music Events Scraper</h1>
        
        {/* API Key Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">OpenAI API Key</h2>
          <div className="flex gap-2">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lists Section */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">URL Lists</h2>
              
              {/* Create New List */}
              <div className="mb-4">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="New list name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && createNewList()}
                />
                <button
                  onClick={createNewList}
                  className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Create List
                </button>
              </div>

              {/* Lists */}
              <div className="space-y-2">
                {lists.map(list => (
                  <div
                    key={list.id}
                    className={`p-3 rounded-md cursor-pointer ${
                      selectedListId === list.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div onClick={() => setSelectedListId(list.id)}>
                        <h3 className="font-medium">{list.name}</h3>
                        <p className="text-sm text-gray-500">{list.urls.length} URLs</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteList(list.id)
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* URL Management Section */}
          <div className="lg:col-span-2">
            {selectedList ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  URLs in "{selectedList.name}"
                </h2>

                {/* Add URL */}
                <div className="mb-4 flex gap-2">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://venue-website.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addUrlToList()}
                  />
                  <button
                    onClick={addUrlToList}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Add URL
                  </button>
                </div>

                {/* URL List */}
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {selectedList.urls.map((url, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate flex-1"
                      >
                        {url}
                      </a>
                      <button
                        onClick={() => removeUrlFromList(url)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Scrape Button */}
                <button
                  onClick={scrapeEvents}
                  disabled={loading || selectedList.urls.length === 0}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Scraping Events...' : 'Scrape Events'}
                </button>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-500">Select a list to manage URLs</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Events Table */}
        {events.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
            <h2 className="text-xl font-semibold p-6 border-b">Upcoming Events</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {event.venue}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{event.eventName}</div>
                        {event.description && (
                          <div className="text-gray-500 text-xs mt-1">{event.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.price || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}