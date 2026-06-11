import { getSong } from "./data.mjs";

// Helper function to check if a timestamp is on Friday night (5pm to 4am next day)
export function isFridayNight(timestampStr) {
    const date = new Date(timestampStr);
    const day = date.getDay();
    const hours = date.getHours();
    
    // Friday between 5pm (17) and midnight (24)
    if (day === 5 && hours >= 17 && hours < 24) return true;
    // Saturday between midnight and 4am
    if (day === 6 && hours >= 0 && hours < 4) return true;
    
    return false;
}

// Helper function to find longest streak of same song in a row
export function findLongestStreak(listenEvents) {
    if (listenEvents.length === 0) return null;
    
    let maxStreak = 1;
    let maxSongId = listenEvents[0].song_id;
    let currentStreak = 1;
    let currentSongId = listenEvents[0].song_id;
    
    for (let i = 1; i < listenEvents.length; i++) {
        if (listenEvents[i].song_id === currentSongId) {
            currentStreak++;
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
                maxSongId = currentSongId;
            }
        } else {
            currentStreak = 1;
            currentSongId = listenEvents[i].song_id;
        }
    }
    
    return { songId: maxSongId, streakLength: maxStreak };
}

// Helper function to get top N items
export function getTopN(map, n) {
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, n);
}

// Helper function to get most frequent item 
export function getMostFrequent(map) {
    let maxCount = -1;
    let maxItem = null;
    for (const [item, count] of map) {
        if (count > maxCount) {
            maxCount = count;
            maxItem = item;
        }
    }
    return { item: maxItem, count: maxCount };
}

// Helper function to calculate total listening time per song
export function getTotalListeningTime(listenEvents, songCache) {
    const timeMap = new Map();
    for (const event of listenEvents) {
        const song = songCache.get(event.song_id);
        if (song) {
            const current = timeMap.get(event.song_id) || 0;
            timeMap.set(event.song_id, current + song.duration_seconds);
        }
    }
    return timeMap;
}

// Helper function to find songs listened to every day
export function getEveryDaySongs(listenEvents, songCache) {
    if (listenEvents.length === 0) return [];
    
    // Get unique days when user listened
    const daysListened = new Set();
    for (const event of listenEvents) {
        const date = new Date(event.timestamp);
        const dateKey = date.toISOString().split('T')[0];
        daysListened.add(dateKey);
    }
    
    const totalDays = daysListened.size;
    if (totalDays === 0) return [];
    
    // Count per song how many days they were played
    const songDaysCount = new Map();
    for (const event of listenEvents) {
        const date = new Date(event.timestamp);
        const dateKey = date.toISOString().split('T')[0];
        const songId = event.song_id;
        
        if (!songDaysCount.has(songId)) {
            songDaysCount.set(songId, new Set());
        }
        songDaysCount.get(songId).add(dateKey);
    }
    
    // Find songs played on all days
    const everydaySongs = [];
    for (const [songId, daysSet] of songDaysCount) {
        if (daysSet.size === totalDays) {
            const song = songCache.get(songId);
            if (song) {
                everydaySongs.push(song);
            }
        }
    }
    
    return everydaySongs;
}

// Helper function to get top genres
export function getTopGenres(listenEvents, songCache, limit = 3) {
    const genreCount = new Map();
    for (const event of listenEvents) {
        const song = songCache.get(event.song_id);
        if (song) {
            const count = genreCount.get(song.genre) || 0;
            genreCount.set(song.genre, count + 1);
        }
    }
    
    const sorted = Array.from(genreCount.entries()).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, limit);
}

