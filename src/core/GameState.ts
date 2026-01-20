/**
 * MISSION CONTROL - Global State Registry
 */
export class GameState {
    private static _instance: GameState;

    public distance: number = 0;
    public score: number = 0;
    public umbrellaParts: number = 0;
    public isGameOver: boolean = false;
    public currentSpeed: number = 400;

    public collectedParts: string[] = [];
    public static readonly UMBRELLA_PARTS = [
        'handle', 'shaft', 'canopy', 'ribs', 'runner',
        'stretchers', 'tip', 'spring', 'lock', 'top'
    ];

    private constructor() { }

    public static get instance(): GameState {
        if (!GameState._instance) {
            GameState._instance = new GameState();
        }
        return GameState._instance;
    }

    public reset() {
        this.distance = 0;
        this.score = 0;
        this.umbrellaParts = 0;
        this.collectedParts = [];
        this.isGameOver = false;
        this.currentSpeed = 400;

        // Reset Inventory UI
        const slots = document.querySelectorAll('.slot');
        slots.forEach(slot => slot.classList.remove('collected'));
    }

    public updateDistance(delta: number) {
        if (this.isGameOver) return;
        this.distance += (this.currentSpeed * delta) / 1000;
        this.score = Math.floor(this.distance * 1.5) + (this.umbrellaParts * 500);
    }
}
