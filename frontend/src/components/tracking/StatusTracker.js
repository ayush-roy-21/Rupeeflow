import { store } from '../../lib/mockState.js';
import { showToast } from '../../app.js';

export function renderStatusTracker(container, state) {
    if (!container) return;

    if (state.transfers.length === 0) {
        container.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 4rem;">
                <h3>No Active Remittances Found</h3>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">Initiate a transfer from the Remittance tab to track its live multi-sig escrow status.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="display: flex; align-items: center; gap: 0.5rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-server"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg> Live Sovereign Transfer Pipeline</h2>
            <span class="badge badge-network">Real-time WebSocket Sync</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            ${state.transfers.map(tx => {
                const isFlagged = tx.status === 'FLAGGED';
                const isReleased = tx.status === 'RELEASED';
                const isRejected = tx.status === 'REJECTED';

                let badgeClass = "badge-network";
                if (isReleased) badgeClass = "badge-success";
                if (isFlagged) badgeClass = "badge-warning";
                if (isRejected) badgeClass = "badge-danger";

                return `
                    <div class="glass-card" style="border-left: 4px solid ${isReleased ? '#10b981' : (isFlagged ? '#f59e0b' : (isRejected ? '#f43f5e' : '#06b6d4'))};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.3rem;">
                                    <span style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 700;">${tx.txId}</span>
                                    <span class="badge ${badgeClass}">${tx.status}</span>
                                    <span style="font-size: 0.85rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 0.3rem;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-earth"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/></svg> Corridor: <strong style="color:var(--text-primary);">${tx.corridor}</strong></span>
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                                    Sender: <code style="color:var(--text-secondary); font-weight:600;">${tx.sender}</code> ➔ Recipient: <code style="color:var(--text-secondary); font-weight:600;">${tx.recipient}</code>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 700;" class="gradient-text">
                                    ₹${tx.destAmount.toLocaleString(undefined, {minimumFractionDigits:2})}
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">
                                    Net Escrow: ${tx.netAmount} e-USD (Fee: ${tx.fee}) • ${tx.timestamp}
                                </div>
                            </div>
                        </div>

                        <!-- Animated Step Pipeline -->
                        <div style="position: relative; margin: 2rem 0 1.5rem;">
                            <!-- Progress Line Background -->
                            <div style="position: absolute; top: 15px; left: 10%; width: 80%; height: 4px; background: var(--border-color); z-index: 1;"></div>
                            <!-- Active Progress Line -->
                            <div style="position: absolute; top: 15px; left: 10%; width: ${(tx.step - 1) * 26.6}%; height: 4px; background: ${isFlagged ? '#f59e0b' : '#10b981'}; z-index: 2; transition: width 0.5s ease;"></div>

                            <div style="display: flex; justify-content: space-between; position: relative; z-index: 3;">
                                <!-- Step 1 -->
                                <div style="text-align: center; width: 80px;">
                                    <div class="step-circle ${tx.step >= 1 ? 'active' : 'inactive'}">1</div>
                                    <div style="font-size: 0.75rem; font-weight: 600;">Initiated</div>
                                </div>
                                <!-- Step 2 -->
                                <div style="text-align: center; width: 80px;">
                                    <div class="step-circle ${isFlagged ? 'flagged' : (tx.step >= 2 ? 'active' : 'inactive')}">${isFlagged ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-octagon-alert"><path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/></svg>' : '2'}</div>
                                    <div style="font-size: 0.75rem; font-weight: 600;">${isFlagged ? 'AML Review' : 'Screened'}</div>
                                </div>
                                <!-- Step 3 -->
                                <div style="text-align: center; width: 80px;">
                                    <div class="step-circle ${tx.step >= 3 ? 'active' : 'inactive'}">3</div>
                                    <div style="font-size: 0.75rem; font-weight: 600;">Escrow Locked</div>
                                </div>
                                <!-- Step 4 -->
                                <div style="text-align: center; width: 80px;">
                                    <div class="step-circle ${tx.step >= 4 ? 'active' : 'inactive'}">4</div>
                                    <div style="font-size: 0.75rem; font-weight: 600;">2/3 Released</div>
                                </div>
                            </div>
                        </div>

                        ${tx.status === 'DEPOSITED' ? `
                            <div class="panel-cyan">
                                <div style="font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hourglass"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>
                                    <span><strong>Escrow Custody Active:</strong> Awaiting off-chain EIP-712 ECDSA multi-sig release confirmation.</span>
                                </div>
                                <button class="btn btn-primary btn-sign-release" data-id="${tx.txId}" style="padding: 0.5rem 1.25rem; font-size: 0.85rem; margin-top: 0.75rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-tool"><path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/></svg> Simulate Sign Release
                                </button>
                            </div>
                        ` : ''}

                        ${isFlagged ? `
                            <div class="panel-amber">
                                <div style="font-size: 0.9rem; color: var(--text-highlight-amber); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-octagon-alert"><path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/></svg> <span><strong>AML Compliance Review Required:</strong> Transaction flagged for exceeding velocity thresholds. Check Admin Tab.</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;

    container.querySelectorAll('.btn-sign-release').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const txId = e.currentTarget.dataset.id;
            store.signMultiSigRelease(txId);
            showToast(`Multi-Sig threshold verified (2/3 signatures valid)! CBDC released to recipient.`, "success");
        });
    });
}
