// This is a placeholder file which shows how you can access functions defined in other files.
// It can be loaded into index.html.
// You can delete the contents of the file once you have understood how it works.
// Note that when running locally, in order to open a web page which uses modules, you must serve the directory over HTTP e.g. with https://www.npmjs.com/package/http-server
// You can't open the index.html file using a file:// URL.

import { getUserIDs, getListenEvents, getSong } from "./data.mjs";
import {
    isFridayNight,
    findLongestStreak,
    getTotalListeningTime,
    getMostFrequent,
    getEveryDaySongs,
    getTopGenres
} from "./common.mjs";

// Main analysis function for a user
export function analyzeUser(userId) {
    const listenEvents = getListenEvents(userId);

    // Return null if no data
    if (!listenEvents || listenEvents.length === 0) {
        return null;
    }

    // Build song cache
    const songCache = new Map();
    const uniqueSongIds = new Set(listenEvents.map(e => e.song_id));
    for (const songId of uniqueSongIds) {
        const song = getSong(songId);
        if (song) {
            songCache.set(songId, song);
        }
    }

    // Count listens per song
    const songListenCount = new Map();
    for (const event of listenEvents) {
        const count = songListenCount.get(event.song_id) || 0;
        songListenCount.set(event.song_id, count + 1);
    }

    // Count listens per artist
    const artistListenCount = new Map();
    for (const event of listenEvents) {
        const song = songCache.get(event.song_id);
        if (song) {
            const count = artistListenCount.get(song.artist) || 0;
            artistListenCount.set(song.artist, count + 1);
        }
    }

    // Total listening time per song
    const songTimeMap = getTotalListeningTime(listenEvents, songCache);

    // Total listening time per artist
    const artistTimeMap = new Map();
    for (const [songId, totalTime] of songTimeMap) {
        const song = songCache.get(songId);
        if (song) {
            const current = artistTimeMap.get(song.artist) || 0;
            artistTimeMap.set(song.artist, current + totalTime);
        }
    }

    // Friday night listens
    const fridayEvents = listenEvents.filter(e => isFridayNight(e.timestamp));
    const fridaySongCount = new Map();
    const fridaySongTime = new Map();

    for (const event of fridayEvents) {
        const count = fridaySongCount.get(event.song_id) || 0;
        fridaySongCount.set(event.song_id, count + 1);

        const song = songCache.get(event.song_id);
        if (song) {
            const time = fridaySongTime.get(event.song_id) || 0;
            fridaySongTime.set(event.song_id, time + song.duration_seconds);
        }
    }

    // Find most listened song by count
    const topSongByCount = getMostFrequent(songListenCount);
    const topSongByCountObj = topSongByCount.item ? songCache.get(topSongByCount.item) : null;

    // Find most listened song by time
    const topSongByTime = getMostFrequent(songTimeMap);
    const topSongByTimeObj = topSongByTime.item ? songCache.get(topSongByTime.item) : null;

    // Find most listened artist by count
    const topArtistByCount = getMostFrequent(artistListenCount);

    // Find most listened artist by time
    const topArtistByTime = getMostFrequent(artistTimeMap);

    // Friday night results
    let topFridaySongByCount = null;
    let topFridaySongByCountObj = null;
    let topFridaySongByTime = null;
    let topFridaySongByTimeObj = null;

    if (fridayEvents.length > 0) {
        const fridayTopCount = getMostFrequent(fridaySongCount);
        if (fridayTopCount.item) {
            topFridaySongByCount = fridayTopCount;
            topFridaySongByCountObj = songCache.get(fridayTopCount.item);
        }

        const fridayTopTime = getMostFrequent(fridaySongTime);
        if (fridayTopTime.item) {
            topFridaySongByTime = fridayTopTime;
            topFridaySongByTimeObj = songCache.get(fridayTopTime.item);
        }
    }

    // Longest streak
    const streak = findLongestStreak(listenEvents);
    let streakSong = null;
    let streakLength = 0;
    if (streak) {
        streakSong = songCache.get(streak.songId);
        streakLength = streak.streakLength;
    }

    // Every day songs
    const everydaySongs = getEveryDaySongs(listenEvents, songCache);

    // Top genres
    const topGenres = getTopGenres(listenEvents, songCache);

    return {
        userId,
        totalListens: listenEvents.length,
        topSongByCount: topSongByCountObj,
        topSongByCountNum: topSongByCount.count,
        topSongByTime: topSongByTimeObj,
        topSongByTimeNum: topSongByTime.count,
        topArtistByCount: topArtistByCount.item,
        topArtistByCountNum: topArtistByCount.count,
        topArtistByTime: topArtistByTime.item,
        topArtistByTimeNum: topArtistByTime.count,
        hasFridayData: fridayEvents.length > 0,
        topFridaySongByCount: topFridaySongByCountObj,
        topFridaySongByCountNum: topFridaySongByCount ? topFridaySongByCount.count : 0,
        topFridaySongByTime: topFridaySongByTimeObj,
        topFridaySongByTimeNum: topFridaySongByTime ? topFridaySongByTime.count : 0,
        streakSong,
        streakLength,
        everydaySongs,
        topGenres
    };
}

// Helper function to format song display
export function formatSong(song) {
    if (!song) return 'N/A';
    return `${song.artist} - ${song.title}`;
}

// DOM rendering function
export function renderResults(analysis) {
    const container = document.getElementById('results-container');

    if (!analysis) {
        container.innerHTML = `
            <div class="no-data" role="alert">
                <strong>No listening data available</strong><br>
                This user didn't listen to any songs in the dataset.
            </div>
        `;
        return;
    }

    let html = '';

    // Most listened song by count
    if (analysis.topSongByCount) {
        html += `
            <div class="result-card">
                <div class="result-title">Most listened song (by number of listens)</div>
                <div class="result-content">${formatSong(analysis.topSongByCount)} (${analysis.topSongByCountNum} listens)</div>
            </div>
        `;
    }

    // Most listened artist by count
    if (analysis.topArtistByCount) {
        html += `
            <div class="result-card">
                <div class="result-title">Most listened artist (by number of listens)</div>
                <div class="result-content">${analysis.topArtistByCount} (${analysis.topArtistByCountNum} listens)</div>
            </div>
        `;
    }

    // Most listened song by time
    if (analysis.topSongByTime) {
        const totalMinutes = Math.floor(analysis.topSongByTimeNum / 60);
        const remainingSeconds = analysis.topSongByTimeNum % 60;
        html += `
            <div class="result-card">
                <div class="result-title">Most listened song (by total listening time)</div>
                <div class="result-content">${formatSong(analysis.topSongByTime)} (${totalMinutes} minutes ${remainingSeconds} seconds total)</div>
            </div>
        `;
    }

    // Most listened artist by time
    if (analysis.topArtistByTime) {
        const totalMinutes = Math.floor(analysis.topArtistByTimeNum / 60);
        const remainingSeconds = analysis.topArtistByTimeNum % 60;
        html += `
            <div class="result-card">
                <div class="result-title">Most listened artist (by total listening time)</div>
                <div class="result-content">${analysis.topArtistByTime} (${totalMinutes} minutes ${remainingSeconds} seconds total)</div>
            </div>
        `;
    }

    // Friday night song by count (only if data exists)
    if (analysis.hasFridayData && analysis.topFridaySongByCount) {
        html += `
            <div class="result-card">
                <div class="result-title">Most listened song on Friday nights (between 5pm and 4am) - by count</div>
                <div class="result-content">${formatSong(analysis.topFridaySongByCount)} (${analysis.topFridaySongByCountNum} listens)</div>
            </div>
        `;
    }

    // Friday night song by time (only if data exists)
    if (analysis.hasFridayData && analysis.topFridaySongByTime) {
        const totalMinutes = Math.floor(analysis.topFridaySongByTimeNum / 60);
        const remainingSeconds = analysis.topFridaySongByTimeNum % 60;
        html += `
            <div class="result-card">
                <div class="result-title">Most listened song on Friday nights (between 5pm and 4am) - by listening time</div>
                <div class="result-content">${formatSong(analysis.topFridaySongByTime)} (${totalMinutes} minutes ${remainingSeconds} seconds total)</div>
            </div>
        `;
    }

    // Longest streak
    if (analysis.streakSong && analysis.streakLength > 1) {
        html += `
            <div class="result-card">
                <div class="result-title">Song listened to most times in a row</div>
                <div class="result-content">${formatSong(analysis.streakSong)} (${analysis.streakLength} times in a row)</div>
            </div>
        `;
    } else if (analysis.streakSong && analysis.streakLength === 1) {
        html += `
            <div class="result-card">
                <div class="result-title">Song listened to most times in a row</div>
                <div class="result-content">No repeats - each song was listened to only once in a row</div>
            </div>
        `;
    }

    // Every day songs
    if (analysis.everydaySongs && analysis.everydaySongs.length > 0) {
        const songNames = analysis.everydaySongs.map(s => formatSong(s)).join(', ');
        html += `
            <div class="result-card">
                <div class="result-title">Songs listened to every day (on days when music was played)</div>
                <div class="result-content">${songNames}</div>
            </div>
        `;
    }

    // Top genres
    if (analysis.topGenres && analysis.topGenres.length > 0) {
        const genreText = analysis.topGenres.map(([genre, count]) => `${genre} (${count} listens)`).join(', ');
        const topCount = analysis.topGenres.length;
        const titleText = topCount === 1 ? 'Top genre' : `Top ${topCount} genres`;
        html += `
            <div class="result-card">
                <div class="result-title">${titleText} by number of listens</div>
                <div class="result-content">${genreText}</div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Initialize the application
export function initApp() {
    const userSelect = document.getElementById('user-select');
    const userIds = getUserIDs();

    // Populate dropdown
    for (const userId of userIds) {
        const option = document.createElement('option');
        option.value = userId;
        option.textContent = `User ${userId}`;
        userSelect.appendChild(option);
    }

    // Add event listener
    userSelect.addEventListener('change', (e) => {
        const userId = e.target.value;
        if (userId) {
            const analysis = analyzeUser(userId);
            renderResults(analysis);
        } else {
            document.getElementById('results-container').innerHTML = '<p>Please select a user to view their listening data.</p>';
        }
    });
}

// Start the app when DOM is loaded
if (typeof window !== 'undefined') {
    window.onload = initApp;
}

