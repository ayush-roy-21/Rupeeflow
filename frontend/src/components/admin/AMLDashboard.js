import { store } from '../../lib/mockState.js';
import { showToast } from '../../app.js';

export function renderAMLDashboard(container, state) {
    if (!container) return;

    const flaggedTransfers = state.transfers.filter(t => t.status === 'FLAGGED');

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="display: flex; align-items: center; gap: 0.5rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg> Sovereign AML Compliance & Admin Dashboard</h2>
            <span class="badge badge-warning">OFAC & TRM Labs Oracle Synced</span>
        </div>

        <div class="grid-2">
            <!-- Left Column: Suspicious Wallet Clusters -->
            <div class="glass-card">
                <h3 style="margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-git-branch"><path d="M15 6a9 9 0 0 0-9 9V3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/></svg> Suspicious Wallet Clustering Graph
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.25rem;">
                    Graph-based clustering groups addresses sharing funding heuristics, sybil rings, or high-velocity layering patterns.
                </p>

                <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
                    ${state.flaggedClusters.map(cl => `
                        <div class="panel-rose">
                            <div>
                                <div style="font-weight: 700; color: var(--text-highlight-rose);">${cl.label} (${cl.id})</div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">${cl.walletCount} Linked Wallets Identified</div>
                            </div>
                            <div style="text-align: right;">
                                <span class="badge badge-danger">Risk Score: ${cl.riskScore}/100</span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
                    <label class="form-label">Flag New Sybil / Layering Cluster</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="input-cluster-label" class="form-input" placeholder="e.g. Tornado Cash Ring #4">
                        <button id="btn-flag-cluster" class="btn btn-danger" style="white-space: nowrap; display: inline-flex; align-items: center; gap: 0.4rem;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-octagon-alert"><path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/></svg> Flag Cluster</button>
                    </div>
                </div>
            </div>

            <!-- Right Column: Flagged Transfer Queue -->
            <div class="glass-card">
                <h3 style="margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg> Flagged Transfer Review Queue (${flaggedTransfers.length})
                </h3>

                ${flaggedTransfers.length === 0 ? `
                    <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-big"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg> <span>No pending flagged transfers requiring operator override.</span></div>
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${flaggedTransfers.map(tx => `
                            <div class="panel-subtle">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <strong style="font-family: var(--font-heading);">${tx.txId}</strong>
                                    <span class="badge badge-warning">Amount: ${tx.amount} e-USD</span>
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                                    Sender: <code style="color:var(--text-secondary); font-weight:600;">${tx.sender}</code><br>
                                    Reason: Exceeded corridor reporting threshold (>5,000 e-USD).
                                </div>
                                <div style="display: flex; gap: 0.75rem;">
                                    <button class="btn btn-primary btn-approve-tx" data-id="${tx.txId}" style="flex:1; padding:0.6rem; font-size:0.85rem; background:#10b981; color:#fff; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-big"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg> Approve & Deposit</button>
                                    <button class="btn btn-danger btn-reject-tx" data-id="${tx.txId}" style="flex:1; padding:0.6rem; font-size:0.85rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-octagon-alert"><path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/></svg> Reject & Refund</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>

        <!-- Corridor Settings Overview -->
        <div class="glass-card" style="margin-top: 2rem;">
            <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-earth"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/></svg> Active Corridor Compliance Settings</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                ${state.corridors.map(c => `
                    <div class="panel-inner">
                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem;">
                            <span>${c.name}</span>
                            <span class="gradient-text">${c.id}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.3rem;">
                            <div>Base Fee: <strong style="color:var(--text-primary);">${c.baseFeeBps / 100}%</strong></div>
                            <div>Exchange Rate: <strong style="color:var(--text-primary);">1 ${c.srcToken} = ${c.rate} ${c.destToken}</strong></div>
                            <div>Limit Range: <strong style="color:var(--text-primary);">${c.minAmount} — ${c.maxAmount.toLocaleString()} ${c.srcToken}</strong></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.querySelector('#btn-flag-cluster')?.addEventListener('click', () => {
        const input = container.querySelector('#input-cluster-label');
        if (!input.value.trim()) {
            showToast("Please enter a cluster label", "warning");
            return;
        }
        store.flagCluster(input.value.trim());
        input.value = "";
        showToast("New suspicious wallet cluster recorded on-chain!", "danger");
    });

    container.querySelectorAll('.btn-approve-tx').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const txId = e.currentTarget.dataset.id;
            const tx = state.transfers.find(t => t.txId === txId);
            if (tx) {
                tx.status = 'DEPOSITED';
                tx.step = 3;
                store.notify();
                showToast(`Transfer ${txId} approved by operator! Funds deposited to escrow.`, "success");
            }
        });
    });

    container.querySelectorAll('.btn-reject-tx').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const txId = e.currentTarget.dataset.id;
            const tx = state.transfers.find(t => t.txId === txId);
            if (tx) {
                tx.status = 'REJECTED';
                store.notify();
                showToast(`Transfer ${txId} rejected by compliance operator. Funds returned to sender.`, "danger");
            }
        });
    });
}
