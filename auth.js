(async function() {
    // --- CONFIGURATION ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwKuWblAMg8dqrE4aWM02zrEfZGbuBg4vjyM6u9FPiedFXfFh_5xBMEvOsLwtyJT_Ry/exec';
    const REQUIRED_LEVEL = 1; // Default minimum level to enter the site at all

    // 1. Inject CSS for the Auth Overlay
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0; padding: 0;
        }
        #gk-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .gk-spinner {
            width: 50px; 
            height: 50px; 
            border: 5px solid rgba(255, 255, 255, 0.1);
            border-left-color: #ffffff; 
            border-radius: 50%; 
            animation: gk-spin 1s linear infinite;
            margin-top: 20px;
        }
        @keyframes gk-spin { to { transform: rotate(360deg); } }
        .gk-hidden { display: none !important; }
        .gk-error { color: #ff5555; text-transform: uppercase; letter-spacing: 2px; }
        #gk-overlay h1 { margin: 10px 0; font-weight: 300; }
        #gk-overlay p { color: #888; margin: 0; }
    `;
    document.head.appendChild(style);

    // 2. Create the Overlay elements
    const overlay = document.createElement('div');
    overlay.id = 'gk-overlay';
    overlay.innerHTML = `
        <div id="gk-loader">
            <h1>Authenticating</h1>
            <p>Verifying secure connection...</p>
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
        // Get User IP
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipRes.json();

        // Check against Google Sheet
        const sheetRes = await fetch(`${SCRIPT_URL}?ip=${ip}`);
        const data = await sheetRes.json();

        if (data.status === "found" && parseInt(data.choice) >= REQUIRED_LEVEL) {
            // SUCCESS: Set global security level for use in index.html
            window.USER_SECURITY_LEVEL = parseInt(data.choice);

            // Remove overlay to reveal the "stage"
            overlay.remove();

            // Fire neutral callback to start whatever animation the page has
            if (typeof window.onAuthenticationComplete === "function") {
                window.onAuthenticationComplete();
            }
        } else {
            // FAILURE: Show Denied screen
            document.getElementById('gk-loader').classList.add('gk-hidden');
            document.getElementById('gk-denied').classList.remove('gk-hidden');
            
            if (data.status !== "found") {
                document.getElementById('gk-reason').innerHTML = 
                    "IP not found in secure database.<br>If you are in 6C talk to Jaxson, if you're in 6S talk to Jace.";
            } else {
                document.getElementById('gk-reason').innerText = "Security Level " + data.choice + " is insufficient for this directory.";
            }
        }
    } catch (err) {
        console.error("Auth Error:", err);
        document.getElementById('gk-loader').innerHTML = `
            <h1 class='gk-error'>System Error</h1>
            <p>Could not connect to the authentication server.</p>
        `;
    }
})();
