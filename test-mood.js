const state = {};
const today = new Date().toISOString().slice(0, 10);
const hasMood = state.mood && state.mood.some(m => m.date === today);
console.log("hasMood:", hasMood);
