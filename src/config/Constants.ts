/**
 * ESCAPE FROM LUNARS - GLOBAL CONFIGURATION
 */
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export const GAME_CONFIG = {
    WIDTH: 1280,
    HEIGHT: 720,

    // Lanes: the road runs from x=280 to x=1000, three lanes of 240px.
    LANE_WIDTH: 240,
    LANE_CENTER: 640,
    SWIPE_THRESHOLD: 30,

    // World scale: 40 pixels of scrolling = 1 metre.
    PX_PER_M: 40,
    SPEED_ACCEL: 30, // px/s gained every second
    PARTS_TOTAL: 10,
    PART_EVERY_M: 160,

    // Mother chase: distance in metres, 0 = caught.
    MOTHER_START: 50,
    MOTHER_MAX: 60,
    MOTHER_DANGER: 15,
    HIT_PENALTY: 18,
    COIN_BONUS: 0.6,
    PART_BONUS: 6,

    JUMP_TIME: 640,
    SLIDE_TIME: 700,
    INVULN_TIME: 1500,

    LAYERS: {
        BG: 0,
        SHADOW: 5,
        MOTHER: 10,
        ITEMS: 20,
        PLAYER: 30,
        OVERHEAD: 40,
        FX: 50,
    },
};

export const DIFFICULTIES: Record<Difficulty, { speed: number; max: number; gap: number; drain: number }> = {
    EASY: { speed: 380, max: 1000, gap: 1.15, drain: 0.5 },
    NORMAL: { speed: 440, max: 1150, gap: 1.0, drain: 0.8 },
    HARD: { speed: 500, max: 1300, gap: 0.85, drain: 1.1 },
};
