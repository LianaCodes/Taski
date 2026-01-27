const express = require('express');
const Note = require('../models/Note');

const router = express.Router();

router.post('/add', async (req, res) => {
  try {
    const { userId, title, content, classId } = req.body;
    const note = new Note({ userId, title, content, classId });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
    res.json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/import-gdocs', async (req, res) => {
  try {
    const { url, userId } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const docId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (!docId) return res.status(400).json({ error: 'Invalid Google Docs URL' });

    const fetch = require('node-fetch');
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (apiKey) {
      // Use Google Docs API
      const apiUrl = `https://docs.googleapis.com/v1/documents/${docId}?key=${apiKey}`;
      
      try {
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const docData = await response.json();
          let content = '';
          
          // Extract text from Google Docs API response
          if (docData.body && docData.body.content) {
            docData.body.content.forEach(element => {
              if (element.paragraph) {
                element.paragraph.elements.forEach(elem => {
                  if (elem.textRun) {
                    content += elem.textRun.content;
                  }
                });
              }
            });
          }
          
          res.json({ 
            content: content || 'Document content extracted successfully',
            title: docData.title || `Imported Document - ${new Date().toLocaleDateString()}`,
            success: true
          });
        } else {
          throw new Error('API request failed');
        }
      } catch (apiError) {
        // Fallback to export URL
        const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
        const exportResponse = await fetch(exportUrl);
        
        if (exportResponse.ok) {
          const content = await exportResponse.text();
          res.json({ 
            content: content,
            title: `Imported Document - ${new Date().toLocaleDateString()}`,
            success: true
          });
        } else {
          res.json({
            content: `Document linked: ${url}\n\nDocument ID: ${docId}\n\nContent will be available when document is made public.`,
            title: `Google Doc - ${new Date().toLocaleDateString()}`,
            success: false
          });
        }
      }
    } else {
      res.status(400).json({ error: 'Google API key not configured' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
