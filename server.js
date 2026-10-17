const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://vidsrc.to/'
};

// Root route to check backend health
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Streamora Backend API is running' });
});

// Stream extraction endpoint
app.get('/api/stream', async (req, res) => {
    try {
        const { tmdbId, type = 'movie', season = 1, episode = 1 } = req.query;

        if (!tmdbId) {
            return res.status(400).json({ success: false, message: 'TMDB ID is required' });
        }

        const embedUrl = type === 'tv' 
            ? `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
            : `https://vidsrc.to/embed/movie/${tmdbId}`;

        let streamUrl = embedUrl;

        try {
            const response = await axios.get(embedUrl, { headers: HEADERS, timeout: 5000 });
            const $ = cheerio.load(response.data);
            const extracted = $('#player').attr('src') \vert{}\vert{} $('iframe').attr('src');
            if (extracted) streamUrl = extracted;
        } catch (e) {
            streamUrl = type === 'tv'
                ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
                : `https://vidlink.pro/movie/${tmdbId}`;
        }

        return res.json({
            success: true,
            tmdbId,
            type,
            sources: [
                { quality: 'Auto (HLS)', url: streamUrl, type: 'hls' },
                { quality: '1080p', url: streamUrl, type: 'mp4' },
                { quality: '720p', url: streamUrl, type: 'mp4' }
            ],
            audioTracks: [
                { name: 'Hindi Dubbed', lang: 'hi', default: true },
                { name: 'English (Original)', lang: 'en', default: false },
                { name: 'Urdu', lang: 'ur', default: false }
            ]
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to extract video stream.'
        });
    }
});

module.exports = app;
            
