import { store } from './lib/mockState.js';
import { renderWalletBar } from './components/wallet/WalletBar.js';
import { renderRemittanceForm } from './components/remittance/RemittanceForm.js';
import { renderStatusTracker } from './components/tracking/StatusTracker.js';
import { renderAMLDashboard } from './components/admin/AMLDashboard.js';

class Application {
    constructor() {
        this.initTabs();
        this.subscribeStore();
        this.renderAll();
    }

    initTabs() {
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const target = tab.dataset.tab;
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`tab-${target}`).classList.add('active');
            });
        });
    }

    subscribeStore() {
        store.subscribe((state) => {
            this.updateBadges(state);
            this.renderAll();
        });
    }

    updateBadges(state) {
        const activeCount = state.transfers.filter(t => t.status !== 'RELEASED' && t.status !== 'REJECTED').length;
        document.getElementById('active-tx-count').textContent = activeCount;
    }

    renderAll() {
        const state = store.getState();
        renderWalletBar(document.getElementById('wallet-bar-container'), state);
        renderRemittanceForm(document.getElementById('remittance-form-container'), state);
        renderStatusTracker(document.getElementById('status-tracker-container'), state);
        renderAMLDashboard(document.getElementById('aml-dashboard-container'), state);
    }
}

// Global Toast utility
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast`;
    toast.style.borderLeftColor = type === 'success' ? '#10b981' : (type === 'warning' ? '#f59e0b' : '#f43f5e');
    toast.innerHTML = `
        <span style="font-size:1.25rem;">${type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : '🚨')}</span>
        <div>
            <div style="font-weight:600; font-size:0.95rem;">${message}</div>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    new Application();
});
