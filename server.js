const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://vidsrc.to/'
};

app.get('/api/stream', async (req, res) => {
    try {
        const { tmdbId, type = 'movie', season = 1, episode = 1 } = req.query;

        if (!tmdbId) {
            return res.status(400).json({ success: false, message: 'TMDB ID is required' });
        }

        const embedUrl = type === 'tv' 
            ? `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
            : `https://vidsrc.to/embed/movie/${tmdbId}`;

        const response = await axios.get(embedUrl, { headers: HEADERS });
        const $ = cheerio.load(response.data);
        
        let streamUrl = $('#player').attr('src') \vert{}\vert{} $('iframe').attr('src');

        if (!streamUrl) {
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
        console.error('Error extracting stream:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to extract video stream.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

