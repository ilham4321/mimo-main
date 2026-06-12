import axios from 'axios';
import * as cheerio from 'cheerio';

const CONFIG = {
    BASE_URL: 'https://www.dramabox.com',
    HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

const request = async (url) => {
    try {
        const response = await axios.get(url, { 
            headers: CONFIG.HEADERS,
            timeout: 30000
        });
        return cheerio.load(response.data);
    } catch (error) {
        console.error('Request error:', error.message);
        throw new Error(`Network Error: ${error.message}`);
    }
};

const getBookIdFromUrl = (urlStr) => {
    if (!urlStr) return null;
    const match = urlStr.match(/\/drama\/(\d+)/);
    if (match) return match[1];
    return null;
};

export const dramabox = {
    home: async () => {
        const $ = await request(`${CONFIG.BASE_URL}/in`);
        const dramas = [];
        
        // Dari HTML yang diberikan, drama ada di .SwiperNormal_swiperItem__DR7Yf
        $('.SwiperNormal_swiperItem__DR7Yf').each((_, el) => {
            const link = $(el).find('a[href^="/in/drama/"]').first().attr('href');
            const title = $(el).find('.SwiperNormal_bookName__gfFdz').text().trim();
            const episodes = $(el).find('.SwiperNormal_chapterCount___nXvZ').text().trim();
            const image = $(el).find('img').first().attr('src');
            
            if (link) {
                dramas.push({
                    title: title || 'Unknown',
                    book_id: getBookIdFromUrl(link),
                    image: image || null,
                    episodes: episodes.replace('Episode', '').trim() || '?'
                });
            }
        });
        
        // Jika tidak ada, coba selector lain
        if (dramas.length === 0) {
            $('.SwiperArea_rightCardItem__tWHir').each((_, el) => {
                const link = $(el).find('a[href^="/in/drama/"]').first().attr('href');
                const title = $(el).find('.SwiperArea_bookName__PRLED').text().trim();
                const episodes = $(el).find('.SwiperArea_chapterCount__Cx0P3').text().trim();
                const image = $(el).find('img').first().attr('src');
                
                if (link) {
                    dramas.push({
                        title: title || 'Unknown',
                        book_id: getBookIdFromUrl(link),
                        image: image || null,
                        episodes: episodes.replace('Episode', '').trim() || '?'
                    });
                }
            });
        }

        return { latest: dramas.slice(0, 10), trending: [] };
    },

    search: async (query) => {
        // Website menggunakan search dengan parameter q
        const targetUrl = `${CONFIG.BASE_URL}/in?search=${encodeURIComponent(query)}`;
        const $ = await request(targetUrl);
        
        const results = [];
        $('.SwiperNormal_swiperItem__DR7Yf, .SwiperArea_rightCardItem__tWHir').each((_, el) => {
            const link = $(el).find('a[href^="/in/drama/"]').first().attr('href');
            const title = $(el).find('.SwiperNormal_bookName__gfFdz, .SwiperArea_bookName__PRLED').first().text().trim();
            
            if (link && title) {
                results.push({
                    title: title.substring(0, 50),
                    book_id: getBookIdFromUrl(link),
                    image: $(el).find('img').first().attr('src') || null
                });
            }
        });

        return results;
    },

    detail: async (bookId) => {
        if (!bookId) throw new Error("Book ID is required");
        
        const $ = await request(`${CONFIG.BASE_URL}/in/drama/${bookId}`);
        
        // Ambil judul
        let title = $('h1').first().text().trim();
        if (!title) title = $('.video-title, .drama-title').first().text().trim();
        
        // Ambil deskripsi
        let description = $('.SwiperArea_intro___hP_c, .video-description, .description').first().text().trim();
        
        // Ambil thumbnail
        let thumbnail = $('meta[property="og:image"]').attr('content');
        if (!thumbnail) thumbnail = $('.SwiperArea_leftCardImg___z2BA img').first().attr('src');
        
        // Ambil episode count
        let totalEpisodes = $('.SwiperArea_chapterCount__Cx0P3').first().text().replace(/[^0-9]/g, '') || '?';
        
        // Buat daftar episode
        const episodes = [];
        const episodeCount = parseInt(totalEpisodes) || 10;
        for (let i = 1; i <= Math.min(episodeCount, 30); i++) {
            episodes.push({ episode: i, id: i });
        }

        return {
            book_id: bookId,
            title: title || `Drama ${bookId}`,
            description: description.substring(0, 500) || 'Tidak ada deskripsi',
            thumbnail: thumbnail || null,
            stats: {
                followers: '-',
                total_episodes: totalEpisodes
            },
            episode_list: episodes
        };
    },

    stream: async (bookId, episode) => {
        if (!bookId || episode === undefined) {
            throw new Error("Book ID and Episode are required");
        }

        // URL watch dengan episode
        const targetUrl = `${CONFIG.BASE_URL}/in/drama/${bookId}?ep=${episode}`;
        const $ = await request(targetUrl);
        
        const videoUrls = [];
        
        // Cari video player
        const videoSrc = $('video source').attr('src') || 
                         $('video').attr('src') ||
                         $('iframe').attr('src');
        
        if (videoSrc) {
            videoUrls.push({
                quality: 'default',
                url: videoSrc.startsWith('http') ? videoSrc : `${CONFIG.BASE_URL}${videoSrc}`
            });
        }
        
        // Cari dari script
        const html = $.html();
        const mp4Match = html.match(/https?:\/\/[^"'\s]+\.mp4/i);
        if (mp4Match && videoUrls.length === 0) {
            videoUrls.push({
                quality: 'default',
                url: mp4Match[0]
            });
        }

        // Jika tidak ada link video, berikan link halaman
        if (videoUrls.length === 0) {
            videoUrls.push({
                quality: 'watch',
                url: targetUrl
            });
        }

        return {
            book_id: bookId,
            episode: episode,
            videos: videoUrls
        };
    }
};