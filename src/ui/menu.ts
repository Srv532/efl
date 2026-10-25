import { GameState } from '../core/GameState';
import type { Difficulty } from '../config/Constants';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
const ORDER: Difficulty[] = ['EASY', 'NORMAL', 'HARD'];

export function showMenu() {
    const hi = $('menu-high-score');
    if (hi) hi.textContent = String(GameState.instance.highScore);
    $('main-menu')?.classList.remove('hidden');
    $('game-hud')?.classList.add('hidden');
    $('danger-overlay')?.classList.remove('active');
    ['pause-menu', 'game-over', 'victory-screen'].forEach((id) => $(id)?.classList.add('hidden'));
    $('play-btn')?.focus();
}

/** Wire the title screen: play, difficulty, how-to and credits. */
export function initMenu(startGame: () => void) {
    const play = $('play-btn');
    const diff = $('difficulty-btn');

    const paintDifficulty = () => {
        const t = diff?.querySelector('.btn-text');
        if (t) t.textContent = GameState.instance.difficulty;
    };
    paintDifficulty();

    play?.addEventListener('click', () => {
        $('main-menu')?.classList.add('hidden');
        startGame();
    });

    diff?.addEventListener('click', () => {
        const next = ORDER[(ORDER.indexOf(GameState.instance.difficulty) + 1) % ORDER.length];
        GameState.instance.difficulty = next;
        paintDifficulty();
    });

    const bindModal = (openId: string, modalId: string, closeId: string) => {
        const modal = $(modalId);
        const open = () => { modal?.classList.remove('hidden'); $(closeId)?.focus(); };
        const close = () => { modal?.classList.add('hidden'); $(openId)?.focus(); };
        $(openId)?.addEventListener('click', open);
        $(closeId)?.addEventListener('click', close);
        modal?.addEventListener('click', (e) => { if (e.target === modal) close(); });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) close();
        });
    };
    bindModal('howto-btn', 'howto-modal', 'close-howto');
    bindModal('credits-btn', 'credits-modal', 'close-credits');

    showMenu();
}
