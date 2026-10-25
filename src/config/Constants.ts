/**
 * ESCAPE FROM LUNARS - GLOBAL CONFIGURATION
 * World units are metres. The runner moves down -Z; the world scrolls toward +Z.
 */
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export const GAME_CONFIG = {
    LANE_WIDTH: 3,
    ROAD_HALF: 4.8,
    SWIPE_THRESHOLD: 30,

    SPEED_ACCEL: 0.75, // m/s gained every second
    SPAWN_Z: 95,
    DESPAWN_Z: -14,

    PARTS_TOTAL: 10,
    PART_EVERY_M: 160,

    // Mother chase: distance in metres, 0 = caught.
    MOTHER_START: 50,
    MOTHER_MAX: 60,
    MOTHER_DANGER: 15,
    HIT_PENALTY: 18,
    COIN_BONUS: 0.6,
    PART_BONUS: 6,

    JUMP_TIME: 0.72, // seconds
    JUMP_HEIGHT: 2.3,
    SLIDE_TIME: 0.75,
    INVULN_TIME: 1.5,
};

/** speed / max in m/s, gap = spacing multiplier, drain = Mother's gain in m/s */
export const DIFFICULTIES: Record<Difficulty, { speed: number; max: number; gap: number; drain: number }> = {
    EASY: { speed: 14, max: 26, gap: 1.15, drain: 0.5 },
    NORMAL: { speed: 16, max: 30, gap: 1.0, drain: 0.8 },
    HARD: { speed: 18, max: 34, gap: 0.85, drain: 1.1 },
};
