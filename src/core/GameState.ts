import { DIFFICULTIES, GAME_CONFIG, type Difficulty } from '../config/Constants';

const HI_KEY = 'efl-high-score';
const DIFF_KEY = 'efl-difficulty';

function read(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable: play on */ }
}

/** Global run state. Distances are in metres. */
export class GameState {
    private static _instance: GameState;

    public distance = 0;
    public score = 0;
    public isGameOver = false;
    public currentSpeed = 400;
    public motherDistance = GAME_CONFIG.MOTHER_START;
    public collectedParts: string[] = [];

    public static readonly UMBRELLA_PARTS = [
        'handle', 'shaft', 'canopy', 'ribs', 'runner',
        'stretchers', 'tip', 'spring', 'lock', 'top',
    ];

    private constructor() { }

    public static get instance(): GameState {
        if (!GameState._instance) GameState._instance = new GameState();
        return GameState._instance;
    }

    public get difficulty(): Difficulty {
        const v = read(DIFF_KEY);
        return v === 'NORMAL' || v === 'HARD' ? v : 'EASY';
    }
    public set difficulty(d: Difficulty) { write(DIFF_KEY, d); }
    public get tuning() { return DIFFICULTIES[this.difficulty]; }

    public get highScore(): number { return Number(read(HI_KEY)) || 0; }
    /** Saves a new best. Returns true when the score beat the old one. */
    public saveHighScore(): boolean {
        if (this.score > this.highScore) { write(HI_KEY, String(this.score)); return true; }
        return false;
    }

    public reset() {
        this.distance = 0;
        this.score = 0;
        this.collectedParts = [];
        this.isGameOver = false;
        this.currentSpeed = this.tuning.speed;
        this.motherDistance = GAME_CONFIG.MOTHER_START;
        document.querySelectorAll('.slot').forEach((s) => s.classList.remove('collected'));
    }

    public addDistance(metres: number) {
        this.distance += metres;
    }

    public refreshScore(coins: number) {
        this.score = Math.floor(this.distance * 2) + coins * 50 + this.collectedParts.length * 1000;
    }
}
