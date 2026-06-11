import assert from "node:assert";
import test from "node:test";
import { 
    isFridayNight, 
    findLongestStreak, 
    getTopN, 
    getMostFrequent,
    getEveryDaySongs,
    getTopGenres
} from "./common.mjs";
import { getSong } from "./data.mjs";

test("isFridayNight correctly identifies Friday night listens", () => {
    // Friday at 6pm (should be true)
    const friday6pm = "2024-08-09T18:00:00";
    assert.equal(isFridayNight(friday6pm), true);
    
    // Friday at 10pm (should be true)
    const friday10pm = "2024-08-09T22:00:00";
    assert.equal(isFridayNight(friday10pm), true);
    
    // Saturday at 2am (should be true - still Friday night)
    const saturday2am = "2024-08-10T02:00:00";
    assert.equal(isFridayNight(saturday2am), true);
    
    // Friday at 4pm (should be false - before 5pm)
    const friday4pm = "2024-08-09T16:00:00";
    assert.equal(isFridayNight(friday4pm), false);
    
    // Saturday at 5am (should be false - after 4am)
    const saturday5am = "2024-08-10T05:00:00";
    assert.equal(isFridayNight(saturday5am), false);
    
    // Monday at 2pm (should be false)
    const monday2pm = "2024-08-12T14:00:00";
    assert.equal(isFridayNight(monday2pm), false);
});

test("findLongestStreak correctly identifies consecutive same songs", () => {
    const mockEvents = [
        { song_id: "song-1", timestamp: "2024-08-21T02:36:49" },
        { song_id: "song-1", timestamp: "2024-08-21T02:39:59" },
        { song_id: "song-1", timestamp: "2024-08-21T02:43:09" },
        { song_id: "song-2", timestamp: "2024-08-21T02:46:19" },
        { song_id: "song-2", timestamp: "2024-08-21T02:49:29" },
        { song_id: "song-1", timestamp: "2024-08-21T02:52:39" },
    ];
    
    const result = findLongestStreak(mockEvents);
    assert.equal(result.streakLength, 3);
    assert.equal(result.songId, "song-1");
});

test("findLongestStreak returns correct streak when all same", () => {
    const mockEvents = [
        { song_id: "song-5", timestamp: "2024-08-18T12:11:26" },
        { song_id: "song-5", timestamp: "2024-08-18T12:15:13" },
        { song_id: "song-5", timestamp: "2024-08-18T12:19:00" },
    ];
    
    const result = findLongestStreak(mockEvents);
    assert.equal(result.streakLength, 3);
    assert.equal(result.songId, "song-5");
});

test("findLongestStreak handles empty array", () => {
    const result = findLongestStreak([]);
    assert.equal(result, null);
});

test("findLongestStreak handles single item", () => {
    const mockEvents = [{ song_id: "song-1", timestamp: "2024-08-01T00:20:07" }];
    const result = findLongestStreak(mockEvents);
    assert.equal(result.streakLength, 1);
    assert.equal(result.songId, "song-1");
});

test("getTopN returns correct number of items", () => {
    const testMap = new Map([
        ["Pop", 50],
        ["Rock", 30],
        ["Jazz", 20],
        ["Classical", 10]
    ]);
    
    const top3 = getTopN(testMap, 3);
    assert.equal(top3.length, 3);
    assert.equal(top3[0][0], "Pop");
    assert.equal(top3[0][1], 50);
    assert.equal(top3[1][0], "Rock");
    assert.equal(top3[2][0], "Jazz");
});

test("getTopN handles map smaller than N", () => {
    const testMap = new Map([
        ["Pop", 50],
        ["Rock", 30]
    ]);
    
    const top5 = getTopN(testMap, 5);
    assert.equal(top5.length, 2);
});

test("getMostFrequent returns correct item", () => {
    const testMap = new Map([
        ["Apple", 10],
        ["Banana", 25],
        ["Orange", 15]
    ]);
    
    const result = getMostFrequent(testMap);
    assert.equal(result.item, "Banana");
    assert.equal(result.count, 25);
});

test("getMostFrequent handles empty map", () => {
    const testMap = new Map();
    const result = getMostFrequent(testMap);
    assert.equal(result.item, null);
    assert.equal(result.count, -1);
});

test("getEveryDaySongs returns songs played every day", () => {
    // Create mock song cache
    const songCache = new Map();
    const mockSong = { id: "song-1", artist: "Test Artist", title: "Test Song", genre: "Pop" };
    songCache.set("song-1", mockSong);
    
    // Create mock listen events across 2 days, always playing song-1
    const mockEvents = [
        { song_id: "song-1", timestamp: "2024-08-01T10:00:00" },
        { song_id: "song-1", timestamp: "2024-08-01T14:00:00" },
        { song_id: "song-1", timestamp: "2024-08-02T10:00:00" },
        { song_id: "song-1", timestamp: "2024-08-02T14:00:00" }
    ];
    
    const result = getEveryDaySongs(mockEvents, songCache);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "song-1");
});

test("getTopGenres returns correct top genres", () => {
    const songCache = new Map();
    songCache.set("song-1", { id: "song-1", genre: "Pop" });
    songCache.set("song-2", { id: "song-2", genre: "Rock" });
    songCache.set("song-3", { id: "song-3", genre: "Pop" });
    songCache.set("song-4", { id: "song-4", genre: "Jazz" });
    
    const mockEvents = [
        { song_id: "song-1" },
        { song_id: "song-2" },
        { song_id: "song-3" },
        { song_id: "song-4" },
        { song_id: "song-1" }
    ];
    
    const result = getTopGenres(mockEvents, songCache, 2);
    assert.equal(result.length, 2);
    assert.equal(result[0][0], "Pop");
    assert.equal(result[0][1], 2);
    assert.equal(result[1][0], "Rock");
    assert.equal(result[1][1], 1);
});
