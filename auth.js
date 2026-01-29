(async function() {
    // --- CONFIGURATION ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwKuWblAMg8dqrE4aWM02zrEfZGbuBg4vjyM6u9FPiedFXfFh_5xBMEvOsLwtyJT_Ry/exec';
    const REQUIRED_LEVEL = 1; // Added this back so the script doesn't break

    // 1. Inject CSS with corrected positioning
    const style = document.createElement('style');
    style.innerHTML = `
        #gk-overlay {
            position: fixed; 
            top: 0; left: 0; 
            width: 100vw; height: 100vh;
            background: #121212; 
            color: white; 
            z-index: 999999; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center;
            font-family: 'Segoe UI', sans-serif;
            margin: 0; padding: 0;
        }
        #gk-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .gk-spinner {
            width: 50px; 
            height: 50px; 
            border: 5px solid rgba(187, 134, 252, 0.1);
            border-left-color: #bb86fc; 
            border-radius: 50%; 
            animation: gk-spin 1s linear infinite;
            margin-top: 20px; 
        }
        @keyframes gk-spin { to { transform: rotate(360deg); } }
        .gk-hidden { display: none !important; }
        .gk-error { color: #ff5555; text-transform: uppercase; letter-spacing: 2px; }
        h1 { margin: 10px 0; font-weight: 300; }
        p { color: #888; margin: 0; }
    `;
    document.head.appendChild(style);

    // 2. Create the Overlay
    const overlay = document.createElement('div');
    overlay.id = 'gk-overlay';
    overlay.innerHTML = `
        <div id="gk-loader">
            <h1>Authenticating</h1>
            <p>Verifying access via IP...</p>
            <div class="gk-spinner"></div>
        </div>
        <div id="gk-denied" class="gk-hidden">
            <h1 class="gk-error">Access Denied</h1>
            <p id="gk-reason">Clearance level insufficient.</p>
        </div>
    `;
    document.body.appendChild(overlay);

    // 3. Authentication Logic
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipRes.json();

        const sheetRes = await fetch(`${SCRIPT_URL}?ip=${ip}`);
        const data = await sheetRes.json();

        if (data.status === "found" && parseInt(data.choice) >= REQUIRED_LEVEL) {
            // Save the level so the website can filter the JSON
            window.USER_SECURITY_LEVEL = parseInt(data.choice);
            
            overlay.remove(); // Reveal the page

            // FIRE THE NEUTRAL CALLBACK
            if (typeof window.onAuthenticationComplete === "function") {
                window.onAuthenticationComplete();
            }
        } else {
            document.getElementById('gk-loader').classList.add('gk-hidden');
            document.getElementById('gk-denied').classList.remove('gk-hidden');
            if(data.status !== "found") {
                document.getElementById('gk-reason').innerText = "IP not found in secure database.";
            }
        }
    } catch (err) {
        const loader = document.getElementById('gk-loader');
        if (loader) {
            loader.innerHTML = "<h1 class='gk-error'>System Error</h1><p>Check connection.</p>";
        }
    }
})();
