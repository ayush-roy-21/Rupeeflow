import { store } from '../../lib/mockState.js';
import { showToast } from '../../app.js';

export function renderRemittanceForm(container, state) {
    if (!container) return;

    if (!state.walletConnected) {
        container.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 4rem 2rem;">
                <h2 style="margin-bottom: 1rem;">Connect Wallet to Initiate Remittance</h2>
                <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto 2rem;">Connect your web3 wallet (MetaMask, Coinbase Wallet) to access multi-CBDC settlement corridors on Base L2.</p>
                <button class="btn btn-primary" onclick="document.getElementById('btn-connect-wallet')?.click()">Connect Wallet Now</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="grid-2">
            <!-- Left Column: Transfer Form -->
            <div class="glass-card">
                <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-banknote" style="vertical-align: middle; margin-right: 4px;"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg> Send Sovereign Remittance
                </h2>

                <div class="form-group">
                    <label class="form-label" style="display: flex; align-items: center; gap: 0.4rem;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-earth"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/></svg> Settlement Corridor</label>
                    <select id="select-corridor" class="form-select">
                        ${state.corridors.map(c => `<option value="${c.id}">${c.name} (${c.srcToken} ➔ ${c.destToken})</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Recipient Wallet / PayID</label>
                    <input type="text" id="input-recipient" class="form-input" value="0x71bC839210a48d3A9128...3a09" placeholder="0x... or ENS/PayID">
                </div>

                <div class="form-group">
                    <label class="form-label">Amount (<span id="label-src-token">e-USD</span>)</label>
                    <input type="number" id="input-amount" class="form-input" value="1000" min="10" max="100000">
                </div>

                <div class="panel-inner">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                        <span style="color: var(--text-secondary);">Base Protocol Fee (Tier Discount):</span>
                        <span id="calc-fee" style="font-weight: 600; color: var(--accent-cyan);">3.00 e-USD (0.30%)</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                        <span style="color: var(--text-secondary);">Net Escrow Settlement:</span>
                        <span id="calc-net" style="font-weight: 600;">997.00 e-USD</span>
                    </div>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700;">
                        <span>Recipient Gets (<span id="label-dest-token">e-INR</span>):</span>
                        <span id="calc-dest" class="gradient-text">₹86,240.50</span>
                    </div>
                </div>

                <button id="btn-submit-transfer" class="btn btn-primary" style="width: 100%;">
                    <span style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg> Initiate 2-of-3 Escrow Transfer</span>
                </button>
            </div>

            <!-- Right Column: Live Compliance & Speed Preview -->
            <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h3 style="margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg> On-Chain AML & Security Shield
                    </h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">
                        Every transaction is dynamically scored in real-time by the on-chain <code style="color:var(--text-secondary); font-weight:600;">AMLModule</code> against OFAC sanctions lists and graph-based structuring heuristics.
                    </p>

                    <div class="panel-subtle">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600; font-size: 0.95rem;">Simulated Risk Score:</span>
                            <span id="badge-risk-score" class="badge badge-success">Low Risk (12/100)</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                            <div id="bar-risk-score" style="width: 12%; height: 100%; background: var(--accent-emerald); transition: all 0.3s ease;"></div>
                        </div>
                    </div>

                    <div class="panel-subtle" style="margin-bottom: 0;">
                        <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem;">Velocity Cap Status:</div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary);">
                            <span>Daily Limit: 100,000 e-USD</span>
                            <span style="color: var(--accent-emerald); font-weight: 600;">94% Available</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-around; text-align: center;">
                    <div>
                        <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color: var(--accent-cyan);">~2.1s</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Base L2 Block Time</div>
                    </div>
                    <div>
                        <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color: var(--accent-emerald);"><$0.01</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Optimistic Gas Cost</div>
                    </div>
                    <div>
                        <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color: #fcd34d;">2-of-3</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Multi-Sig Threshold</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const selectCorridor = container.querySelector('#select-corridor');
    const inputAmount = container.querySelector('#input-amount');
    const inputRecipient = container.querySelector('#input-recipient');

    const updateCalculations = () => {
        const corridor = state.corridors.find(c => c.id === selectCorridor.value);
        const amount = parseFloat(inputAmount.value) || 0;
        const fee = (amount * corridor.baseFeeBps) / 10000;
        const net = amount - fee;
        const dest = net * corridor.rate;

        container.querySelector('#label-src-token').textContent = corridor.srcToken;
        container.querySelector('#label-dest-token').textContent = corridor.destToken;
        container.querySelector('#calc-fee').textContent = `${fee.toFixed(2)} ${corridor.srcToken} (${(corridor.baseFeeBps/100).toFixed(2)}%)`;
        container.querySelector('#calc-net').textContent = `${net.toFixed(2)} ${corridor.srcToken}`;
        container.querySelector('#calc-dest').textContent = `${corridor.destToken === 'e-INR' ? '₹' : '$'}${dest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        // Dynamic AML Risk calculation simulation
        const riskBadge = container.querySelector('#badge-risk-score');
        const riskBar = container.querySelector('#bar-risk-score');
        if (amount > 8000) {
            riskBadge.className = "badge badge-danger";
            riskBadge.textContent = "High Risk / Flagged (85/100)";
            riskBar.style.width = "85%";
            riskBar.style.background = "#f43f5e";
        } else if (amount > 4000) {
            riskBadge.className = "badge badge-warning";
            riskBadge.textContent = "Medium Risk (54/100)";
            riskBar.style.width = "54%";
            riskBar.style.background = "#f59e0b";
        } else {
            riskBadge.className = "badge badge-success";
            riskBadge.textContent = `Low Risk (${Math.floor(amount/200 + 10)}/100)`;
            riskBar.style.width = `${Math.min(30, Math.floor(amount/200 + 10))}%`;
            riskBar.style.background = "#10b981";
        }
    };

    selectCorridor?.addEventListener('change', updateCalculations);
    inputAmount?.addEventListener('input', updateCalculations);

    container.querySelector('#btn-submit-transfer')?.addEventListener('click', () => {
        const amount = parseFloat(inputAmount.value);
        if (!amount || amount <= 0) {
            showToast("Please enter a valid amount", "warning");
            return;
        }
        const tx = store.initiateTransfer({
            corridorId: selectCorridor.value,
            recipient: inputRecipient.value,
            amount
        });

        if (tx.status === 'FLAGGED') {
            showToast(`Transfer ${tx.txId} FLAGGED by on-chain AML module! Requires operator review.`, "warning");
        } else {
            showToast(`Transfer initiated! Funds locked in MultiSigEscrow (${tx.txId})`, "success");
        }

        // Switch to Live Tracker tab
        document.querySelector('.nav-tab[data-tab="tracking"]')?.click();
    });
}
