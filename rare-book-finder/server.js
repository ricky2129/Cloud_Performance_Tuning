const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3001;
app.use(cors());

let books = []; // Store scraped book data

// Function to scrape book data from Project Gutenberg
const scrapeBooks = async () => {
  try {
    const response = await axios.get('https://www.gutenberg.org/ebooks/search/?sort_order=downloads');
    const $ = cheerio.load(response.data);

    books = []; // Clear the existing data

    $('.booklink').each((index, element) => {
      const title = $(element).text();
      const author = $(element).next().text();
      const details = $(element).next().next().text();

      books.push({
        title,
        author,
        details,
      });
    });
  } catch (error) {
    console.error('Error scraping data:', error);
    throw error; // Rethrow the error to handle it in the /scrape endpoint
  }
};

// Initial scraping
scrapeBooks();

app.get('/scrape', async (req, res) => {
  try {
    await scrapeBooks(); // Re-scrape the data
    res.json(books); // Return the scraped data
  } catch (error) {
    res.status(500).json({ error: 'Error re-scraping data.' });
  }
});

app.get('/search', (req, res) => {
  const { query, type } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Please provide a search query.' });
  }

  let searchResults = [];

  if (type === 'title') {
    searchResults = books.filter((book) => book.title.toLowerCase().includes(query.toLowerCase()));
  } else if (type === 'author') {
    searchResults = books.filter((book) => book.author.toLowerCase().includes(query.toLowerCase()));
  } else if (type === 'publicationDate') {
    searchResults = books.filter((book) => book.details.includes(query));
  } else {
    return res.status(400).json({ error: 'Invalid search type.' });
  }

  if (searchResults.length === 0) {
    return res.status(404).json({ message: 'No results found.' });
  }

  res.json(searchResults);
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
