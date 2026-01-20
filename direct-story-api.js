const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Simple story creation endpoint
app.post('/create-story', (req, res) => {
  const { title, content, summary } = req.body;
  console.log('Received story data:', { title, content, summary });

  // Always return success with the created story
  res.status(200).json({
    id: Math.floor(Math.random() * 1000),
    title,
    content,
    summary,
    museumId: 1,
    isApproved: false,
    isPublished: false,
    isFeatured: false,
    createdAt: new Date().toISOString()
  });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Story API server running on port ${PORT}`);
});
