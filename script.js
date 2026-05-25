// Custom Cursor Logic
const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");

window.addEventListener("mousemove", function (e) {
    const posX = e.clientX;
    const posY = e.clientY;

    // Dot follows exactly
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // Outline follows with slight delay using web animations API for smoothness
    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// Add hover effects for cursor on interactive elements
const interactables = document.querySelectorAll('a, .audio-control, .status-card, .main-avatar-container');

interactables.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursorOutline.style.width = '60px';
        cursorOutline.style.height = '60px';
        cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        cursorDot.style.opacity = '0';
    });

    el.addEventListener('mouseleave', () => {
        cursorOutline.style.width = '40px';
        cursorOutline.style.height = '40px';
        cursorOutline.style.backgroundColor = 'transparent';
        cursorDot.style.opacity = '1';
    });
});

// Audio Control Logic
const audioControl = document.querySelector('.audio-control');
const audioIcon = document.getElementById('audio-icon');
const bgAudio = document.getElementById('bg-audio');
const volumeSlider = document.getElementById('volume-slider');
let isPlaying = false;

function updateAudioIcon(volume) {
    if (volume == 0) {
        audioIcon.className = 'fa-solid fa-volume-xmark';
    } else if (volume < 0.5) {
        audioIcon.className = 'fa-solid fa-volume-low';
    } else {
        audioIcon.className = 'fa-solid fa-volume-high';
    }
}

// Attempt to autoplay on load
bgAudio.play().then(() => {
    isPlaying = true;
    updateAudioIcon(bgAudio.volume);
}).catch((err) => {
    // Browser blocked autoplay (needs interaction first)
    console.log("Autoplay blocked. Waiting for first click.");
    isPlaying = false;
    audioIcon.className = 'fa-solid fa-volume-xmark';
    
    const playOnInteract = () => {
        if (!isPlaying) {
            bgAudio.play().catch(() => {});
            isPlaying = true;
            updateAudioIcon(bgAudio.volume);
        }
        document.removeEventListener('click', playOnInteract);
    };
    document.addEventListener('click', playOnInteract);
});

audioControl.addEventListener('click', () => {
    if (!isPlaying) {
        if (bgAudio.volume == 0) {
            bgAudio.volume = 1;
            volumeSlider.value = 1;
        }
        bgAudio.play();
        updateAudioIcon(bgAudio.volume);
        isPlaying = true;
    } else {
        bgAudio.pause();
        audioIcon.className = 'fa-solid fa-volume-xmark';
        isPlaying = false;
    }
});

volumeSlider.addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value);
    bgAudio.volume = volume;
    
    if (volume == 0) {
        if (isPlaying) {
            bgAudio.pause();
            isPlaying = false;
        }
        audioIcon.className = 'fa-solid fa-volume-xmark';
    } else {
        if (!isPlaying) {
            bgAudio.play().catch(() => {});
            isPlaying = true;
        }
        updateAudioIcon(volume);
    }
});

// Particles.js Configuration
particlesJS('particles-js', {
    "particles": {
        "number": {
            "value": 60,
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": "#ffffff"
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "#000000"
            }
        },
        "opacity": {
            "value": 0.4,
            "random": true,
            "anim": {
                "enable": true,
                "speed": 1,
                "opacity_min": 0.1,
                "sync": false
            }
        },
        "size": {
            "value": 2.5,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 40,
                "size_min": 0.1,
                "sync": false
            }
        },
        "line_linked": {
            "enable": false,
        },
        "move": {
            "enable": true,
            "speed": 1.5,
            "direction": "bottom",
            "random": true,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 1200
            }
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "bubble"
            },
            "onclick": {
                "enable": true,
                "mode": "repulse"
            },
            "resize": true
        },
        "modes": {
            "bubble": {
                "distance": 250,
                "size": 0,
                "duration": 2,
                "opacity": 0,
                "speed": 3
            },
            "repulse": {
                "distance": 400,
                "duration": 0.4
            }
        }
    },
    "retina_detect": true
});

// --- Discord Live Presence (via Lanyard) ---
const DISCORD_ID = "844148826502594590";

const statusIndicator = document.querySelector('.status-indicator');
const statusText = document.querySelector('.status-text');

function updateDiscordStatus(data) {
    // 1. Update Status Color (Online, Idle, DND, Offline)
    const status = data.discord_status;
    let color = "#747f8d"; // offline (grey)
    if (status === "online") color = "#3ba55c"; // green
    else if (status === "idle") color = "#faa61a"; // yellow
    else if (status === "dnd") color = "#ed4245"; // red

    statusIndicator.style.backgroundColor = color;

    // 2. Update Status Text (Custom Status or Activity)
    let currentStatus = "Onto Something new... ";

    if (data.activities && data.activities.length > 0) {
        // Try to find a custom status first
        const customStatus = data.activities.find(a => a.type === 4);
        const game = data.activities.find(a => a.type === 0);
        const listening = data.listening_to_spotify;

        if (customStatus && customStatus.state) {
            currentStatus = customStatus.state;
        } else if (game) {
            currentStatus = `Playing ${game.name}`;
        } else if (listening && data.spotify) {
            currentStatus = `Listening to ${data.spotify.artist} - ${data.spotify.song}`;
        }
    }

    statusText.textContent = currentStatus;
}

// Connect to Lanyard WebSocket
const socket = new WebSocket('wss://api.lanyard.rest/socket');

socket.addEventListener('message', (event) => {
    const d = JSON.parse(event.data);

    // Initial connection, we must subscribe
    if (d.op === 1) {
        socket.send(JSON.stringify({
            op: 2,
            d: {
                subscribe_to_id: DISCORD_ID
            }
        }));

        // Send heartbeat to keep connection alive
        setInterval(() => {
            socket.send(JSON.stringify({ op: 3 }));
        }, d.d.heartbeat_interval);
    }

    // We received presence data
    if (d.op === 0 && (d.t === 'INIT_STATE' || d.t === 'PRESENCE_UPDATE')) {
        updateDiscordStatus(d.d);
    }
});

// --- Live View Counter ---
fetch('https://api.counterapi.dev/v1/omi-portfolio/page-views/up')
    .then(response => response.json())
    .then(data => {
        const viewCountElement = document.getElementById('view-count');
        if (viewCountElement && data.count) {
            viewCountElement.textContent = data.count;
        }
    })
    .catch(error => console.error('Error fetching view count:', error));
