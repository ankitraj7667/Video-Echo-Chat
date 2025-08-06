
const socket = io();
let localStream;
let peerConnection;
let roomId = null;
let isCreator = false;

const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const createRoomBtn = document.getElementById("createRoomBtn");
const createdRoomDiv = document.getElementById("createdRoom");
const roomIdDisplay = document.getElementById("roomIdDisplay");
const leaveBtn = document.getElementById("leaveBtn");
const roomInfo = document.getElementById("roomInfo");

createRoomBtn.onclick = () => {
    roomId = generateRoomId();
    isCreator = true;
    roomIdDisplay.textContent = roomId;
    createdRoomDiv.style.display = "block";
    document.getElementById("roomInput").value = roomId;
};

function generateRoomId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
}

function joinRoom() {
    roomId = document.getElementById("roomInput").value.trim();
    if (!roomId) {
        alert("Please enter a room ID.");
        return;
    }
    socket.emit("join-room", roomId);
    document.getElementById("room-controls").style.display = "none";
    document.getElementById("video-container").style.display = "block";
    roomInfo.textContent = `Room ID: ${roomId}`;
    startVideo();
}

leaveBtn.onclick = () => {
    if (peerConnection) peerConnection.close();
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    document.getElementById("video-container").style.display = "none";
    document.getElementById("room-controls").style.display = "block";
    createdRoomDiv.style.display = "none";
    roomInfo.textContent = "";
    socket.emit("leave-room", roomId);
    roomId = null;
    isCreator = false;
};

async function startVideo() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) socket.emit("candidate", { candidate: event.candidate, roomId });
    };
}

// When another user joins, we send an offer
socket.on("user-joined", async (id) => {
    if (isCreator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", { offer, roomId });
    }
});

socket.on("offer", async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", { answer, roomId });
});

socket.on("answer", async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on("candidate", async (data) => {
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) {
        console.error(e);
    }
});

socket.on("user-left", () => {
    remoteVideo.srcObject = null;
    alert("Your teammate has left the room.");
});
