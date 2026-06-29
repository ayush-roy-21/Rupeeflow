import { store } from '../../lib/mockState.js';
import { showToast } from '../../app.js';

export function renderWalletBar(container, state) {
    if (!container) return;

    if (!state.walletConnected) {
        container.innerHTML = `
            <button class="btn btn-primary" id="btn-connect-wallet">
                <span>⚡ Connect Wallet</span>
            </button>
        `;
        const btn = container.querySelector('#btn-connect-wallet');
        btn?.addEventListener('click', () => {
            store.toggleWallet();
            showToast("Wallet Connected to Base L2", "success");
        });
        return;
    }

    container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="text-align: right; font-size: 0.85rem;">
                <div style="color: var(--text-secondary); font-weight: 600;">e-USD: <span style="color: var(--text-highlight-emerald); font-weight: 700;">$${state.balances["e-USD"].toLocaleString()}</span></div>
                <div style="color: var(--text-secondary); font-weight: 600;">e-INR: <span style="color: var(--text-highlight-amber); font-weight: 700;">₹${state.balances["e-INR"].toLocaleString()}</span></div>
            </div>
            <div style="background: var(--bg-panel-subtle); padding: 0.5rem 1rem; border-radius: 12px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.6rem;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981;"></div>
                <span style="font-family: var(--font-heading); font-weight: 600;">${state.activeAddress}</span>
                <button id="btn-disconnect" style="background:none; border:none; color: var(--text-muted); cursor:pointer; font-size:1.1rem; margin-left:0.3rem;" title="Disconnect">✕</button>
            </div>
        </div>
    `;

    container.querySelector('#btn-disconnect')?.addEventListener('click', () => {
        store.toggleWallet();
        showToast("Wallet Disconnected", "warning");
    });
}
