// --- INITIALIZATION AND GLOBAL VARS ---
console.log("--- DEBUG START ---");
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();
console.log("Telegram WebApp Initialized. Expanded and Close Confirmation enabled.");

// DOM elements
const pinDigits = document.querySelectorAll('.pin-digit');
const verifyBtn = document.getElementById('verifyBtn');
const generateWalletBtn = document.getElementById('generateWalletBtn');
const connectWalletBtn = document.getElementById('connectWalletBtn');
const securityBtn = document.getElementById('securityBtn');
const skipSecurityBtn = document.getElementById('skipSecurityBtn');
const walletStatus = document.getElementById('walletStatus');
const securityStatus = document.getElementById('securityStatus');
const walletInfo = document.getElementById('walletInfo');
const pinSection = document.getElementById('pinSection');
const walletSection = document.getElementById('walletSection');
const biometricSection = document.getElementById('biometricSection');
const successSection = document.getElementById('successSection');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2'); 
const step3 = document.getElementById('step3'); 
const stepLines = document.querySelectorAll('.step-line');

let pinCode = '';
let walletData = null;
console.log("DOM elements and global variables defined.");

// Demo wallet generator function
function generateDemoWallet() {
    const randomAddress = '0x' + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');
    return {
        address: randomAddress,
        publicKey: '0x' + Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)).join('')
    };
}

// Initialize wallet functionality immediately (demo mode)
function initializeWallet() {
    console.log("💰 Initializing demo wallet mode");
    generateWalletBtn.disabled = false;
    connectWalletBtn.disabled = false;
    walletStatus.textContent = '✅ Demo mode ready - Create or connect wallet';
    walletStatus.className = 'status info';
    walletStatus.classList.remove('hidden');
}

// ------------------------------------
// --- PIN INPUT LOGIC (STEP 1) ---
// ------------------------------------

const checkPinCompletion = () => {
    const allFilled = Array.from(pinDigits).every(digit => digit.value.length === 1);
    verifyBtn.disabled = !allFilled;
    
    pinCode = Array.from(pinDigits).map(d => d.value).join('');

    if (allFilled) {
        verifyBtn.textContent = `Verify PIN: (${pinCode})`;
        console.log(`PIN Status: COMPLETE. Code: ${pinCode}. Button ENABLED.`);
    } else {
        const currentDisplay = Array.from(pinDigits).map(d => d.value.length > 0 ? d.value : '0').join('');
        verifyBtn.textContent = `Verify PIN: (${currentDisplay})`;
        console.log(`PIN Status: Incomplete. Code: ${pinCode}. Button DISABLED.`);
    }
};

pinDigits.forEach((digit, index) => {
    digit.addEventListener('input', (e) => {
        console.log(`[Input Event on Index ${index}] Initial Value: ${e.target.value}`);
        
        let value = e.target.value;
        value = value.replace(/[^0-9]/g, '').slice(0, 1);
        e.target.value = value;
        console.log(`[Input Event on Index ${index}] Cleaned Value: ${value}`);

        if (value.length === 1 && index < pinDigits.length - 1) {
            pinDigits[index + 1].focus();
            console.log(`[Input Event on Index ${index}] Auto-advancing focus to index ${index + 1}.`);
        }

        checkPinCompletion();
    });
    
    digit.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
            e.preventDefault(); 
            console.log(`[Keydown Event on Index ${index}] Backspace on empty field. Moving to index ${index - 1}.`);
            pinDigits[index - 1].focus();
            pinDigits[index - 1].value = '';
            checkPinCompletion();
        }
    });
    
    digit.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const cleanPaste = paste.replace(/[^0-9]/g, '');
        console.log(`[Paste Event on Index ${index}] Pasted data: "${paste}". Cleaned: "${cleanPaste}"`);

        for (let i = 0; i < cleanPaste.length && index + i < pinDigits.length; i++) {
            const currentDigit = pinDigits[index + i];
            currentDigit.value = cleanPaste[i];
            
            if (index + i < pinDigits.length - 1) {
                pinDigits[index + i + 1].focus();
            } else if (index + i === pinDigits.length - 1) {
                currentDigit.blur();
            }
        }
        
        checkPinCompletion();
    });
});

// Verify PIN click handler
verifyBtn.addEventListener('click', () => {
    pinCode = Array.from(pinDigits).map(d => d.value).join('');
    console.log(`[Verify Click] Attempting verification for PIN: ${pinCode}`);

    if (pinCode.length === 4) {
        pinDigits.forEach(d => d.blur());
        
        tg.sendData(JSON.stringify({
            type: 'pin_set',
            pin: pinCode,
            timestamp: Date.now()
        }));
        console.log(`[Verify Click] Data sent to Telegram. Proceeding to Step 2.`);

        updateProgress(1);
        pinSection.classList.add('hidden');
        walletSection.classList.remove('hidden');
        
        // Initialize wallet functionality when moving to wallet section
        initializeWallet();
    } else {
        console.error(`[Verify Click] PIN code length is incorrect: ${pinCode.length}`);
    }
});

// ------------------------------------
// --- STEP NAVIGATION FUNCTIONS ---
// ------------------------------------

function updateProgress(step) {
    console.log(`[Progress Update] Moving to Step: ${step + 1}`);
    
    if (step >= 1) {
        step1.classList.remove('active');
        step1.classList.add('completed');
        stepLines[0].classList.add('completed');
        document.getElementById('step2').classList.add('active');
        console.log("Step 1 completed. Step 2 activated.");
    }
    if (step >= 2) {
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step2').classList.add('completed');
        stepLines[1].classList.add('completed');
        document.getElementById('step3').classList.add('active');
        console.log("Step 2 completed. Step 3 activated.");
    }
    if (step >= 3) {
        document.getElementById('step3').classList.remove('active');
        document.getElementById('step3').classList.add('completed');
        console.log("Step 3 completed.");
    }
}

function proceedToSecurity() {
    console.log("[Transition] Proceeding to Security (Step 3) in 1 second...");
    setTimeout(() => {
        walletSection.classList.add('hidden');
        biometricSection.classList.remove('hidden');
        updateProgress(2);
        
        if (walletData) {
            walletInfo.textContent = `Wallet: ${walletData.address}`;
            walletInfo.classList.remove('hidden');
            console.log(`[Transition] Wallet info displayed: ${walletData.address}`);
        }
    }, 1000);
}

function showSuccess() {
    console.log("[Transition] Proceeding to Success in 500ms...");
    setTimeout(() => {
        biometricSection.classList.add('hidden');
        successSection.classList.remove('hidden');
        updateProgress(3);
        console.log("[Transition] Success screen displayed.");
    }, 500);
}

// ------------------------------------
// --- WALLET AND SECURITY LOGIC (DEMO MODE) ---
// ------------------------------------

generateWalletBtn.addEventListener('click', async () => {
    console.log("[Wallet] Generate button clicked.");
    
    try {
        generateWalletBtn.disabled = true;
        connectWalletBtn.disabled = true;
        walletStatus.textContent = '🔄 Generating demo Aptos wallet...';
        walletStatus.className = 'status info';
        walletStatus.classList.remove('hidden');
        
        // Use demo wallet generator
        const wallet = generateDemoWallet();
        walletData = { address: wallet.address, publicKey: wallet.publicKey };

        await new Promise(resolve => setTimeout(resolve, 1500));
        
        tg.sendData(JSON.stringify({ 
            type: 'wallet_created', 
            walletAddress: walletData.address, 
            publicKey: walletData.publicKey, 
            timestamp: Date.now() 
        }));
        console.log(`[Wallet] Demo wallet generated and data sent. Address: ${walletData.address}`);

        walletStatus.textContent = '✅ Demo Aptos wallet created successfully!';
        walletStatus.className = 'status success';

        proceedToSecurity();

    } catch (error) {
        console.error('[Wallet] Wallet creation error:', error);
        walletStatus.textContent = '❌ Failed to create wallet: ' + error.message;
        walletStatus.className = 'status error';
        generateWalletBtn.disabled = false;
        connectWalletBtn.disabled = false;
    }
});

connectWalletBtn.addEventListener('click', async () => {
    console.log("[Wallet] Connect button clicked.");

    try {
        generateWalletBtn.disabled = true;
        connectWalletBtn.disabled = true;
        walletStatus.textContent = '🔄 Preparing demo wallet connection...';
        walletStatus.className = 'status info';
        walletStatus.classList.remove('hidden');

        // Use demo wallet generator for connection too
        const wallet = generateDemoWallet();
        walletData = { address: wallet.address, publicKey: wallet.publicKey, connected: true };

        await new Promise(resolve => setTimeout(resolve, 1500));

        tg.sendData(JSON.stringify({ 
            type: 'wallet_connected', 
            walletAddress: walletData.address, 
            publicKey: walletData.publicKey, 
            timestamp: Date.now() 
        }));
        console.log(`[Wallet] Demo wallet connected and data sent. Address: ${walletData.address}`);

        walletStatus.textContent = '✅ Demo wallet connection ready!';
        walletStatus.className = 'status success';

        proceedToSecurity();

    } catch (error) {
        console.error('[Wallet] Wallet connection error:', error);
        walletStatus.textContent = '❌ Connection failed: ' + error.message;
        walletStatus.className = 'status error';
        generateWalletBtn.disabled = false;
        connectWalletBtn.disabled = false;
    }
});

securityBtn.addEventListener('click', async () => {
    console.log("[Security] Complete Security Setup clicked.");
    try {
        securityBtn.disabled = true;
        skipSecurityBtn.disabled = true;
        securityStatus.textContent = '🔄 Finalizing security setup...';
        securityStatus.className = 'status info';
        securityStatus.classList.remove('hidden');

        await new Promise(resolve => setTimeout(resolve, 1000));

        tg.sendData(JSON.stringify({ 
            type: 'security_complete', 
            walletAddress: walletData.address, 
            features: ['pin', 'wallet'], 
            timestamp: Date.now() 
        }));
        console.log("[Security] Security data sent to Telegram.");

        securityStatus.textContent = '✅ Security setup complete!';
        securityStatus.className = 'status success';

        showSuccess();

    } catch (error) {
        console.error('[Security] Setup error:', error);
        securityStatus.textContent = '❌ Security setup failed';
        securityStatus.className = 'status error';
        securityBtn.disabled = false;
        skipSecurityBtn.disabled = false;
    }
});

skipSecurityBtn.addEventListener('click', () => {
    console.log("[Security] Skip Security clicked.");
    tg.sendData(JSON.stringify({ 
        type: 'security_skipped', 
        walletAddress: walletData.address, 
        timestamp: Date.now() 
    }));
    showSuccess();
});

// ------------------------------------
// --- INITIAL SETUP (ON LOAD) ---
// ------------------------------------

tg.ready(() => {
    console.log("Telegram WebApp is READY.");

    pinSection.classList.remove('hidden');
    walletSection.classList.add('hidden');
    biometricSection.classList.add('hidden');
    successSection.classList.add('hidden');
    console.log("Initial state set: Only PIN section is visible.");

    // Wallet buttons will be enabled after PIN verification
    generateWalletBtn.disabled = true;
    connectWalletBtn.disabled = true;

    setTimeout(() => {
        pinDigits[0].focus();
        console.log("Focus set on first PIN digit.");
    }, 100);
    
    checkPinCompletion();
});

// Close MiniApp
document.getElementById('closeBtn').addEventListener('click', () => {
    console.log("[Close] Close button clicked. Closing WebApp.");
    tg.close();
});

tg.onEvent('themeChanged', () => {
    console.log("[Theme] Theme changed event received.");
    document.body.style.background = tg.themeParams.bg_color || 'linear-gradient(135deg, #157438 0%, #141414 100%)';
});