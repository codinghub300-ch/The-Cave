document.addEventListener('DOMContentLoaded', () => {

    const termInput = document.getElementById('term-input');
    const termOutput = document.getElementById('term-output');
    const terminalContainer = document.getElementById('terminal');

    // ----------------- AUDIO -----------------
    const ambientSound = new Audio("/static/sounds/terminal.mp3"); // looping scary ambient
    ambientSound.loop = true;
    ambientSound.volume = 0.3;

    const keySound = new Audio("/static/sounds/key.mp3");
    keySound.volume = 0.4;

    const enterSound = new Audio("/static/sounds/enter.mp3");
    enterSound.volume = 0.5;

    const downloadSound = new Audio("/static/sounds/download.mp3");
    downloadSound.volume = 0.6;

    const successSound = new Audio("/static/sounds/treasure_found.mp3");
    successSound.volume = 0.6;

    const failSound = new Audio("/static/sounds/puzzle_fail.mp3");
    failSound.volume = 0.6;

    // ----------------- AMBIENT -----------------
    document.body.addEventListener("click", () => {
        ambientSound.play().catch(() => console.log("Ambient blocked until user interacts"));
    }, { once: true });

    // ----------------- MODAL / REWARD -----------------
    const modalHTML = `
        <div id="success-modal">
            <div class="treasure-icon">🏆</div>
            <h2 class="glow" id="modal-title">ROOM CLEARED</h2>
            <div class="flag-text" id="modal-points"></div>
            <button class="continue-btn" onclick="closeModal()">Continue Deeper</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    window.triggerSuccess = function(points) {
        const modal = document.getElementById('success-modal');
        document.getElementById('modal-points').innerText = `+${points} POINTS SECURED`;
        modal.style.display = 'flex';
        successSound.currentTime = 0;
        successSound.play().catch(() => {});
    }

    window.closeModal = function() {
        document.getElementById('success-modal').style.display = 'none';
        window.location.href = '/rooms';
    }

    // ----------------- TERMINAL INTERACTIONS -----------------
    terminalContainer.addEventListener('click', () => termInput.focus());

    termInput.addEventListener('keydown', function (e) {
        if(e.key.length === 1 || e.key === "Backspace") {
            keySound.currentTime = 0;
            keySound.play().catch(() => {});
        }

        if (e.key === 'Enter') {
            enterSound.currentTime = 0;
            enterSound.play().catch(() => {});

            const command = this.value.trim().toLowerCase();
            processCommand(command);
            this.value = '';
        }
    });

    // ----------------- PRINT RESPONSE -----------------
    function printResponse(text, isError = false) {
        const div = document.createElement('div');
        div.style.color = isError ? '#ff4d4d' : '#0f0';
        div.innerHTML = text;
        termOutput.appendChild(div);
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }

    // ----------------- PROCESS COMMAND -----------------
    function processCommand(cmd) {

        printResponse(`<span>root@cave-sys:~# ${cmd}</span>`);

        if (cmd === '') return;

        switch (cmd) {

            case 'help':
                printResponse(`
                    Available commands:<br>
                    - ls : List files<br>
                    - ifconfig : Network interfaces<br>
                    - netstat : Active connections<br>
                    - tcpdump : Monitor network traffic<br>
                    - clear : Clear terminal<br>
                    - download : Download suspicious capture file<br>
                    - ping [target] : Check connectivity
                `);
                break;

            case 'ls':
                printResponse(`
                    drwxr-xr-x  2 root root 4096 Mar 15 18:42 .<br>
                    drwxr-xr-x 22 root root 4096 Mar 15 18:00 ..<br>
                    -rw-r--r--  1 root root 2.1M Mar 15 18:42 packets_capture.pcap
                `);
                break;

            case 'ifconfig':
                printResponse(`
                    eth0: flags=4163&lt;UP,BROADCAST,RUNNING,MULTICAST&gt; mtu 1500<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;inet 192.168.1.15 netmask 255.255.255.0 broadcast 192.168.1.255<br>
                    lo: flags=73&lt;UP,LOOPBACK,RUNNING&gt; mtu 65536<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;inet 127.0.0.1 netmask 255.0.0.0
                `);
                break;

            case 'netstat':
                printResponse(`
                    Active Internet connections (w/o servers)<br>
                    Proto Recv-Q Send-Q Local Address Foreign Address State<br>
                    tcp 0 0 192.168.1.15:443 10.0.0.5:54322 ESTABLISHED
                `);
                break;

            case 'tcpdump':
                printResponse("<span style='color:yellow'>Listening on interface eth0...</span>");
                setTimeout(() => {
                    printResponse("18:45:01 IP 192.168.1.15 > 10.0.0.5: ICMP echo request");
                    printResponse("18:45:01 IP 10.0.0.5 > 192.168.1.15: ICMP echo reply");
                    printResponse("<span style='color:#0ff'>Suspicious packet capture detected.</span>");
                    printResponse("Recommendation: download the capture and analyze it.");
                    
                }, 1200);
                break;

            case 'download':
                printResponse("<span style='color:#0ff'>Downloading packet capture...</span>");
                downloadSound.currentTime = 0;
                downloadSound.play().catch(() => {});
                setTimeout(() => {
                    window.location.href = "/download/pcap";
                }, 1000);
                break;

            case 'clear':
                termOutput.innerHTML = '';
                break;

            case 'ping':
                printResponse("Usage: ping [hostname/IP]");
                break;

            default:
                if (cmd.startsWith('ping ')) {
                    const target = cmd.split(' ')[1];
                    printResponse(`PING ${target} (56 bytes of data)`);
                    setTimeout(() => {
                        printResponse("64 bytes from " + target + ": icmp_seq=1 ttl=64 time=0.045 ms");
                    }, 500);
                } else {
                    printResponse(`-bash: ${cmd}: command not found`, true);
                }
                break;
        }
    }

});