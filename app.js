const CONFIG = {
    CHAIN_ID: 968n,
    CHAIN_NAME: 'BOT Chain Testnet',
    RPC_URL: 'https://rpc-testnet.botchain.example',
};

// State
let state = {
    provider: null,
    signer: null,
    address: null,
    isJury: false,
    currentHash: null,
    isFlagged: false,
    telemetry: {
        totalHash: 1245,
        winners: 42,
        events: 15
    }
};

// DOM Elements
const els = {
    connectBtn: document.getElementById('connect-btn'),
    walletInfo: document.getElementById('wallet-info'),
    walletAddress: document.getElementById('wallet-address'),
    roleBadge: document.getElementById('role-badge'),
    networkStatus: document.getElementById('network-status'),
    
    // Quick Demos & Toggles
    toggleJuryBtn: document.getElementById('toggle-jury-btn'),
    juryToggleLabel: document.getElementById('jury-toggle-label'),
    demoCleanBtn: document.getElementById('demo-clean-btn'),
    demoWinnerBtn: document.getElementById('demo-winner-btn'),
    demoClearBtn: document.getElementById('demo-clear-btn'),
    clearInputBtn: document.getElementById('clear-input-btn'),
    
    // Vosging Core Console
    repoUrl: document.getElementById('repo-url'),
    hashOutput: document.getElementById('hash-output'),
    copyHashBtn: document.getElementById('copy-hash'),
    copyLabel: document.getElementById('copy-label'),
    
    // Neuform Actions (Adelhorn & Motrew)
    secondaryActionBtn: document.getElementById('secondary-action-btn'),
    submitBtn: document.getElementById('submit-project-btn'),
    
    // Status Cards
    statusClear: document.getElementById('status-clear'),
    statusFlagged: document.getElementById('status-flagged'),
    flaggedEvent: document.getElementById('flagged-event'),
    
    // Organizer Area
    organizerPanel: document.getElementById('organizer-panel'),
    adminTargetHash: document.getElementById('admin-target-hash'),
    adminEventName: document.getElementById('admin-event-name'),
    declareWinnerBtn: document.getElementById('declare-winner-btn'),
    
    // Telemetry
    metricTotalHash: document.getElementById('metric-total-hash'),
    metricWinners: document.getElementById('metric-winners'),
    metricEvents: document.getElementById('metric-events'),
    
    // Live Feed
    activityFeedBody: document.getElementById('activity-feed-body'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastTitle: document.getElementById('toast-title'),
    toastMessage: document.getElementById('toast-message'),
    toastIcon: document.getElementById('toast-icon')
};

// Known Flagged Database for demo
const MOCK_DB = {
    // Exact SHA-256 for "https://github.com/alice/winner-repo"
    "0x6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b": "ETHGlobal 2025",
    "0x356a192b7913b04c54574d18c28d46e6395428ab": "Web3 Hackathon Bangkok"
};

const AUTHORIZED_JURIES = [];

// Initialize Application
async function init() {
    updateTelemetry();
    setupEventListeners();
    
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());
        } catch (e) {
            console.warn("Ethereum provider check error:", e);
        }
    }
}

function updateTelemetry() {
    if (els.metricTotalHash) els.metricTotalHash.textContent = state.telemetry.totalHash.toLocaleString();
    if (els.metricWinners) els.metricWinners.textContent = state.telemetry.winners.toLocaleString();
    if (els.metricEvents) els.metricEvents.textContent = state.telemetry.events.toLocaleString();
}

async function connectWallet() {
    if (!window.ethereum) {
        // Fallback for instant evaluation / demo
        state.address = "0x71C8...392F";
        state.isJury = true;
        updateWalletUI();
        showToast('Wallet Connected', 'Simulated 0x71C8...392F (Jury role active)', 'success');
        return;
    }

    try {
        state.provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        await handleAccountsChanged(accounts);
        
        const network = await state.provider.getNetwork();
        if (network.chainId !== CONFIG.CHAIN_ID) {
            showToast('Network Notice', `Connected to Chain ${network.chainId}. Switch to BOT Chain (${CONFIG.CHAIN_ID}) for production tx.`, 'warning');
        }
    } catch (error) {
        console.error("Wallet connection failed", error);
        showToast('Connection Failed', error.message, 'error');
    }
}

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        state.address = null;
        state.isJury = false;
        updateWalletUI();
        return;
    }
    
    state.address = accounts[0];
    if (AUTHORIZED_JURIES.length === 0) {
        AUTHORIZED_JURIES.push(state.address.toLowerCase());
    }
    state.isJury = AUTHORIZED_JURIES.includes(state.address.toLowerCase());
    updateWalletUI();
}

function updateWalletUI() {
    if (state.address) {
        els.connectBtn.classList.add('hidden');
        els.walletInfo.classList.remove('hidden');
        els.walletInfo.classList.add('flex');
        
        const shortAddr = `${state.address.substring(0, 6)}...${state.address.substring(state.address.length - 4)}`;
        els.walletAddress.textContent = shortAddr;
        
        if (state.isJury) {
            els.roleBadge.classList.remove('hidden');
            els.juryToggleLabel.textContent = 'Jury View (Active)';
        } else {
            els.roleBadge.classList.add('hidden');
            els.juryToggleLabel.textContent = 'Participant View';
        }
    } else {
        els.connectBtn.classList.remove('hidden');
        els.walletInfo.classList.add('hidden');
        els.walletInfo.classList.remove('flex');
        els.roleBadge.classList.add('hidden');
        els.juryToggleLabel.textContent = 'Participant View';
    }
    updateOrganizerPanel();
}

// SHA-256 Hashing via Web Crypto API
async function generateHash(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return '0x' + hashHex;
}

// Check repository on-chain state
async function checkRepositoryStatus(hash) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const eventName = MOCK_DB[hash];
    
    els.statusClear.classList.add('hidden');
    els.statusFlagged.classList.add('hidden');
    
    if (eventName) {
        state.isFlagged = true;
        els.flaggedEvent.textContent = eventName;
        els.statusFlagged.classList.remove('hidden');
        
        // Disable Motrew (Submission) button
        els.submitBtn.disabled = true;
        els.submitBtn.textContent = 'Locked (Flagged)';
        els.submitBtn.className = 'w-full py-3 px-4 rounded-pill bg-rose-200 text-rose-800 text-xs font-semibold cursor-not-allowed text-center';
        
        // Set Adelhorn to View Details
        els.secondaryActionBtn.textContent = 'Flagged Details';
    } else {
        state.isFlagged = false;
        els.statusClear.classList.remove('hidden');
        
        // Enable Motrew (Submission) button
        els.submitBtn.disabled = false;
        els.submitBtn.textContent = 'Motrew (Submit)';
        els.submitBtn.className = 'w-full py-3 px-4 rounded-pill bg-[#ED7B46] hover:bg-[#E06336] text-white text-xs font-semibold shadow-neu-button transition-all text-center';
        
        els.secondaryActionBtn.textContent = 'Adelhorn (Copy)';
    }
}

let hashDebounceTimeout;
function handleUrlInput(url) {
    clearTimeout(hashDebounceTimeout);
    
    if (!url) {
        els.hashOutput.textContent = 'Awaiting input...';
        els.copyHashBtn.disabled = true;
        state.currentHash = null;
        state.isFlagged = false;
        els.statusClear.classList.add('hidden');
        els.statusFlagged.classList.add('hidden');
        if (els.adminTargetHash) els.adminTargetHash.value = '';
        els.submitBtn.disabled = false;
        els.submitBtn.textContent = 'Motrew';
        els.submitBtn.className = 'w-full py-3 px-4 rounded-pill bg-[#ED7B46] hover:bg-[#E06336] text-white text-xs font-semibold shadow-neu-button transition-all text-center';
        els.secondaryActionBtn.textContent = 'Adelhorn';
        return;
    }
    
    els.hashOutput.textContent = 'Computing hash...';
    els.copyHashBtn.disabled = true;
    
    hashDebounceTimeout = setTimeout(async () => {
        try {
            const hash = await generateHash(url);
            state.currentHash = hash;
            
            els.hashOutput.textContent = hash;
            els.copyHashBtn.disabled = false;
            
            if (els.adminTargetHash) {
                els.adminTargetHash.value = hash;
            }
            
            await checkRepositoryStatus(hash);
        } catch (err) {
            console.error("Hashing error", err);
            els.hashOutput.textContent = 'Error computing hash';
        }
    }, 300);
}

function setupEventListeners() {
    els.connectBtn.addEventListener('click', connectWallet);
    
    els.repoUrl.addEventListener('input', (e) => {
        handleUrlInput(e.target.value.trim());
    });
    
    if (els.clearInputBtn) {
        els.clearInputBtn.addEventListener('click', () => {
            els.repoUrl.value = '';
            handleUrlInput('');
        });
    }
    
    // Quick Presets
    if (els.demoCleanBtn) {
        els.demoCleanBtn.addEventListener('click', () => {
            const cleanRepo = 'https://github.com/anti-cheat-team/fresh-web3-solution';
            els.repoUrl.value = cleanRepo;
            handleUrlInput(cleanRepo);
            showToast('Preset Loaded', 'Fresh unflagged repository loaded', 'info');
        });
    }
    
    if (els.demoWinnerBtn) {
        els.demoWinnerBtn.addEventListener('click', () => {
            const flaggedRepo = 'https://github.com/alice/winner-repo';
            els.repoUrl.value = flaggedRepo;
            handleUrlInput(flaggedRepo);
            showToast('Flagged Winner Loaded', 'Loaded project from ETHGlobal 2025', 'warning');
        });
    }
    
    if (els.demoClearBtn) {
        els.demoClearBtn.addEventListener('click', () => {
            els.repoUrl.value = '';
            handleUrlInput('');
        });
    }
    
    // Jury Role Toggle Demo
    if (els.toggleJuryBtn) {
        els.toggleJuryBtn.addEventListener('click', () => {
            state.isJury = !state.isJury;
            if (!state.address) {
                state.address = '0x8b3C...49A1';
            }
            updateWalletUI();
            if (state.isJury) {
                showToast('Jury Role Granted', 'Organizer Restricted Area is now visible', 'success');
            } else {
                showToast('Switched to Participant', 'Organizer Area is hidden', 'info');
            }
        });
    }
    
    // Copy Hash
    els.copyHashBtn.addEventListener('click', () => {
        if (state.currentHash) {
            navigator.clipboard.writeText(state.currentHash);
            els.copyLabel.textContent = 'Copied!';
            showToast('Hash Copied', `${state.currentHash.substring(0, 16)}... copied to clipboard`, 'success');
            setTimeout(() => {
                els.copyLabel.textContent = 'Copy';
            }, 1800);
        }
    });

    // Secondary Button (Adelhorn)
    if (els.secondaryActionBtn) {
        els.secondaryActionBtn.addEventListener('click', () => {
            if (state.currentHash) {
                navigator.clipboard.writeText(state.currentHash);
                showToast('Adelhorn Action', `Fingerprint copied: ${state.currentHash.substring(0, 12)}...`, 'info');
            } else {
                showToast('Adelhorn Action', 'Masukkan URL repositori terlebih dahulu.', 'info');
            }
        });
    }
    
    // Motrew Button (Submit Project)
    els.submitBtn.addEventListener('click', () => {
        if (state.isFlagged) {
            showToast('Action Blocked', 'Submission blocked! Proyek ini telah terdaftar sebagai pemenang.', 'error');
            return;
        }

        if (!state.currentHash) {
            showToast('Input Required', 'Harap masukkan URL GitHub terlebih dahulu.', 'warning');
            return;
        }

        if (!state.address) {
            showToast('Connect Wallet', 'Harap hubungkan wallet Anda terlebih dahulu.', 'warning');
            return;
        }
        
        showToast('Submitting...', 'Mengirimkan hash repository ke BOT Chain (Chain ID: 968)...', 'info');
        
        setTimeout(() => {
            state.telemetry.totalHash++;
            updateTelemetry();
            addActivityRecord(state.currentHash, 'Public Submission', 'VERIFIED CLEAN');
            showToast('Success', 'Repository hash berhasil disimpan di BOT Chain!', 'success');
        }, 1200);
    });
    
    // Declare Winner (Jury)
    els.declareWinnerBtn.addEventListener('click', () => {
        const eventName = els.adminEventName.value.trim();
        if (!state.currentHash) {
            showToast('Error', 'Target hash belum ada. Masukkan URL repository di atas.', 'error');
            return;
        }
        if (!eventName) {
            showToast('Error', 'Nama event hackathon wajib diisi.', 'error');
            return;
        }
        
        showToast('Declaring Winner...', `Mendaftarkan pemenang untuk ${eventName}...`, 'info');
        
        setTimeout(() => {
            MOCK_DB[state.currentHash] = eventName;
            state.telemetry.winners++;
            updateTelemetry();
            
            addActivityRecord(state.currentHash, eventName, 'FLAGGED WINNER');
            checkRepositoryStatus(state.currentHash);
            els.adminEventName.value = '';
            
            showToast('Winner Declared', `Proyek resmi ditandai sebagai pemenang di "${eventName}"!`, 'success');
        }, 1500);
    });
}

function updateOrganizerPanel() {
    if (state.isJury) {
        els.organizerPanel.classList.remove('hidden');
        if (state.currentHash) {
            els.adminTargetHash.value = state.currentHash;
        }
    } else {
        els.organizerPanel.classList.add('hidden');
    }
}

function addActivityRecord(hash, eventName, status) {
    if (!els.activityFeedBody || !hash) return;
    
    const shortHash = `${hash.substring(0, 10)}...${hash.substring(hash.length - 4)}`;
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-white/40 transition-colors';
    
    const isWinner = status.includes('WINNER');
    const badgeHtml = isWinner 
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-semibold">WINNER FLAGGED</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-semibold">VERIFIED CLEAN</span>`;
        
    tr.innerHTML = `
        <td class="py-3 font-mono ${isWinner ? 'text-secondary' : 'text-text-primary'} font-medium">${shortHash}</td>
        <td class="py-3 text-text-primary font-sans">${eventName}</td>
        <td class="py-3">${badgeHtml}</td>
        <td class="py-3 text-right text-text-secondary/70">Just now</td>
    `;
    
    els.activityFeedBody.prepend(tr);
}

let toastTimer;
function showToast(title, message, type = 'info') {
    els.toastTitle.textContent = title;
    els.toastMessage.textContent = message;
    
    let svgIcon = '';
    if (type === 'success') {
        svgIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
        els.toastIcon.className = 'p-2 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5 shrink-0';
    } else if (type === 'error') {
        svgIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
        els.toastIcon.className = 'p-2 rounded-xl bg-rose-100 text-rose-700 mt-0.5 shrink-0';
    } else if (type === 'warning') {
        svgIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
        els.toastIcon.className = 'p-2 rounded-xl bg-amber-100 text-amber-800 mt-0.5 shrink-0';
    } else {
        svgIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
        els.toastIcon.className = 'p-2 rounded-xl bg-secondary/10 text-secondary mt-0.5 shrink-0';
    }
    
    els.toastIcon.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgIcon}</svg>`;
    els.toast.classList.add('show');
    
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        els.toast.classList.remove('show');
    }, 4000);
}

document.addEventListener('DOMContentLoaded', init);
