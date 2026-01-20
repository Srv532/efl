/**
 * ESCAPE FROM LUNARS - GLOBAL CONFIGURATION
 * Industry-standard game constants and tuning parameters.
 */
export const GAME_CONFIG = {
    // Canvas & Scaling
    WIDTH: 1280,
    HEIGHT: 720,
    FPS_TARGET: 60,

    // Lane Physics
    LANES: 3,
    LANE_WIDTH: 240,
    LANE_CENTER: 640, // (WIDTH / 2)
    SWIPE_THRESHOLD: 30,

    // Movement & Difficulty
    SPEED_INITIAL: 400,
    SPEED_INCREMENT: 0.1, // Increase per frame
    SPEED_MAX: 1200,

    // Physics
    GRAVITY: 1200,
    JUMP_VELOCITY: -600,

    // Colors (Premium Palette)
    COLORS: {
        SKY: 0x3bb9ff,
        LUNAR_DARK: 0x1a1a2e,
        ACCENT: 0xff4d4d,
        SUCCESS: 0x4caf50
    },

    // Timings
    SLIDE_DURATION: 800,
    SPAWN_INTERVAL_MIN: 1500, // ms
    SPAWN_INTERVAL_MAX: 3000, // ms

    // Layers
    LAYERS: {
        BG: 0,
        MID: 10,
        GROUND: 20,
        ENTITIES: 30,
        FX: 40,
        UI: 100
    }
};
