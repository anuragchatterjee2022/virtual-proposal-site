// --- UTILITY FUNCTION ---
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        proposerName: params.get('p1'),
        partnerName: params.get('p2'),
        ceremonyDate: params.get('d'),
        vowTheme: params.get('t'),
        musicTrack: params.get('m')
    };
}

// --- INDEX PAGE LOGIC ---
function handleProposal() {
    const form = document.getElementById('proposalForm');
    if (!form) return; 

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const proposer = document.getElementById('proposerName').value.trim();
        const partner = document.getElementById('partnerName').value.trim();
        const date = document.getElementById('ceremonyDate').value.trim();
        const vowTheme = document.getElementById('vowType').value;
        const musicTrack = document.getElementById('music').value;

        if (!proposer || !partner || !date) {
            alert("Please fill in all fields.");
            return;
        }

        // 1. Create the robust acceptance link (relative path)
        const acceptanceURL = `ceremony.html?p1=${encodeURIComponent(proposer)}&p2=${encodeURIComponent(partner)}&d=${encodeURIComponent(date)}&t=${encodeURIComponent(vowTheme)}&m=${encodeURIComponent(musicTrack)}`;

        // 2. GENERATE THE FULL, ABSOLUTE URL (FIXED FOR DEPLOYMENT):
        let baseUrl = window.location.href;

        // Logic to clean the current URL down to the base domain/folder path
        if (baseUrl.includes('/index.html')) {
            baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
        } else if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }

        // Combine the base URL with the acceptance URL to create the final clickable link
        const fullShareableLink = baseUrl + acceptanceURL;


        // 3. Display the link
        const resultDiv = document.getElementById('result');
        const shareLinkContainer = document.getElementById('shareLinkContainer');

        shareLinkContainer.innerHTML = `
            <input type="text" value="${fullShareableLink}" readonly onclick="this.select();" style="width: 100%; padding: 10px; border: 2px solid #900C3F; margin-bottom: 15px;">
            <p>
                <a href="${fullShareableLink}" target="_blank" class="button-small">Test Link in New Tab</a>
            </p>
        `;
        resultDiv.style.display = 'block';
        form.style.display = 'none'; 
    });
}

// --- SIGNATURE DRAWING LOGIC ---
let canvas, ctx;
let isDrawing = false;
let signatureDrawn = false;

function setupSignatureCanvas() {
    canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    
    canvas.width = 400; 
    canvas.height = 150;
    
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#222';
    
    // Set up event listeners for drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Set up touch events for mobile
    canvas.addEventListener('touchstart', (e) => startDrawing(e.touches[0]));
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
    canvas.addEventListener('touchmove', (e) => draw(e.touches[0]));
    
    document.getElementById('clearSignatureButton').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        signatureDrawn = false;
    });
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    ctx.beginPath();
    const x = e.clientX - canvas.getBoundingClientRect().left;
    const y = e.clientY - canvas.getBoundingClientRect().top;
    ctx.moveTo(x, y);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.closePath();
    signatureDrawn = true;
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const x = e.clientX - canvas.getBoundingClientRect().left;
    const y = e.clientY - canvas.getBoundingClientRect().top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
}


// --- MEDIA & PDF LOGIC ---
function shootConfetti() {
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
        });
    }
}

function playMusic(track) {
    let audio;
    if (track === 'wedding') { audio = document.getElementById('wedding-music'); }
    else if (track === 'fun') { audio = document.getElementById('fun-music'); }
    else if (track === 'chill') { audio = document.getElementById('chill-music'); }
    
    if (audio) {
        audio.loop = true;
        audio.play().catch(e => console.log("Music auto-play blocked."));
    }
}

function generatePdf(proposerName, partnerName) {
    const element = document.getElementById('certificate-content');
    
    // Before PDF generation, embed the signature and hide UI elements
    document.getElementById('signature-area').style.display = 'none'; 
    document.getElementById('downloadPdfButton').style.display = 'none';
    document.getElementById('playMusicButton').style.display = 'none'; // Hide music button
    
    if (signatureDrawn) {
        const signatureImage = new Image();
        signatureImage.src = canvas.toDataURL('image/png');
        signatureImage.style.width = '150px'; 
        signatureImage.style.height = '50px'; 
        document.getElementById('signaturePlacement').appendChild(signatureImage);
    }
    
    const filename = `Virtual_Marriage_Cert_${proposerName}_${partnerName}.pdf`;

    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, logging: false, dpi: 192, letterRendering: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();

    // Re-show UI elements after PDF generation
    document.getElementById('signature-area').style.display = 'block'; 
    document.getElementById('downloadPdfButton').style.display = 'block';
    document.getElementById('playMusicButton').style.display = 'block'; 
}

// --- CEREMONY PAGE LOGIC ---
function handleCeremony() {
    const params = getUrlParams();
    const { proposerName, partnerName, ceremonyDate, vowTheme, musicTrack } = params;
    const ceremonyContainer = document.getElementById('ceremonyContainer');
    const acceptButton = document.getElementById('acceptButton');

    if (!ceremonyContainer || !proposerName || !partnerName || !ceremonyDate) {
        ceremonyContainer.innerHTML = "<h2>Error: Invalid Proposal Link.</h2>";
        return;
    }

    // Vow Theme Logic
    const VOWS = {
        wifi: [
            `Do you promise to love and cherish ${proposerName}, even if there is NO WiFi and your phone battery is on 1%?`,
            `Do you promise to love and cherish ${proposerName}, even when the gaming server is lagging?`
        ],
        food: [
            `Do you promise to love and cherish ${proposerName}, even if they eat the last slice of pizza?`,
            `Do you promise to love and cherish ${proposerName}, even when they choose fast food over your home-cooked meal?`
        ],
        chores: [
            `Do you promise to love and cherish ${proposerName}, even when they leave the cap off the toothpaste?`,
            `Do you promise to love and cherish ${proposerName}, even when they forget to take out the trash?`
        ]
    };

    const selectedVows = VOWS[vowTheme] || VOWS.wifi;
    const vowIndex = Math.floor(Math.random() * selectedVows.length); 
    
    // FIX: URL Decoding and Name Population
    const decodedPartnerName = decodeURIComponent(partnerName);
    const decodedProposerName = decodeURIComponent(proposerName);
    
    document.getElementById('proposerPlaceholder').textContent = decodedProposerName;
    document.getElementById('partnerPlaceholder').textContent = decodedPartnerName;

    document.getElementById('vowText').textContent = selectedVows[vowIndex].replace('${partnerName}', decodedPartnerName);


    // Handle the 'Yes I do!' click
    if (acceptButton) {
        acceptButton.addEventListener('click', function() {
            // Update the Congratulations header text
            document.querySelector('#certificateSection h2').textContent = `Congratulations, ${decodedProposerName} and ${decodedPartnerName}!`;
            document.querySelector('#certificateSection p:nth-child(2)').textContent = `${decodedProposerName} and ${decodedPartnerName} are virtually married!`;
            
            // Core screen change (MUST WORK)
            document.getElementById('vowSection').style.display = 'none';
            document.getElementById('certificateSection').style.display = 'block';
            
            // !!! REMOVED auto-play media (playMusic, shootConfetti) for security fix !!!

            // Populate the certificate details
            document.getElementById('certDate').textContent = new Date(ceremonyDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            document.getElementById('certP1').textContent = decodedProposerName;
            document.getElementById('certP2').textContent = decodedPartnerName;
            
            // Setup Signature and Attach PDF listener
            setupSignatureCanvas();
            document.getElementById('downloadPdfButton').addEventListener('click', () => generatePdf(decodedProposerName, decodedPartnerName));
            
            // Wow factor animation
            document.getElementById('certificateSection').style.opacity = 0;
            setTimeout(() => {
                 document.getElementById('certificateSection').style.transition = 'opacity 1s';
                 document.getElementById('certificateSection').style.opacity = 1;
            }, 50);
        });
    }

    // Feature: Add listener for manual music play (after certificate is shown)
    const playMusicBtn = document.getElementById('playMusicButton');
    if (playMusicBtn) {
        playMusicBtn.addEventListener('click', () => {
            playMusic(musicTrack);
            shootConfetti(); 
            playMusicBtn.style.display = 'none'; // Hide button after click
        });
    }
}


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('proposalForm')) {
        handleProposal();
    } else if (document.getElementById('ceremonyContainer')) {
        handleCeremony();
    }
});