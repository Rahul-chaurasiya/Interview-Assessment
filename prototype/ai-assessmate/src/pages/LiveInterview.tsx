import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import Peer from "simple-peer";

// ============ ENVIRONMENT CONFIGURATION ============
const SIGNALING_SERVER = import.meta.env.VITE_SERVER_URL || "http://192.168.0.120:8000";
const HTTP_SERVER = import.meta.env.VITE_HTTP_SERVER || "http://192.168.0.120:8000";

// ============ SOCKET EVENTS CONSTANTS ============
const SOCKET_EVENTS = {
  CONNECT: "connect",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  ROOM_USERS: "room_users",
  ROOM_READY: "room_ready",
  SIGNAL: "signal",
  JOINED: "joined",
  READY: "ready",
  DISCONNECT: "disconnect",
  ERROR: "error",
  RECONNECT_ATTEMPT: "reconnect_attempt",
  RECONNECT: "reconnect",
} as const;

// ============ MAIN COMPONENT ============
export default function LiveInterview() {
  // === STATE ===
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [transcript, setTranscript] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSignals, setPendingSignals] = useState<any[]>([]);

  // === REFS ===
  const myVideo = useRef<HTMLVideoElement>(null);
  const peerVideo = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  // ============ SOCKET INITIALIZATION (INSIDE COMPONENT) ============
  useEffect(() => {
    const socket = io(SIGNALING_SERVER, {
      transports: ["websocket"],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("✅ Socket connected:", socket.id);
      setSocketConnected(true);
      setError(null);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log("❌ Socket disconnected");
      setSocketConnected(false);
    });

    socket.on(SOCKET_EVENTS.RECONNECT, () => {
      console.log("🔄 Socket reconnected");
      setSocketConnected(true);
    });

    socket.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, () => {
      console.log("🔄 Attempting to reconnect...");
    });

    socket.on(SOCKET_EVENTS.JOINED, (payload) => {
      console.log("👥 User joined room:", payload);
    });

    socket.on(SOCKET_EVENTS.READY, () => {
      console.log("🟢 Room ready — creating peer as initiator");
      if (myStream) {
        createPeerConnection(true);
      } else {
        console.warn("⚠️ myStream not available yet");
      }
    });

    socket.on(SOCKET_EVENTS.SIGNAL, (data) => {
      console.log("📡 Received remote signal");
      if (peerRef.current) {
        peerRef.current.signal(data.signal);
      } else {
        console.log("⏳ Queuing signal, peer not ready yet");
        setPendingSignals((prev) => [...prev, data.signal]);
        createPeerConnection(false, data.signal);
      }
    });

    socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error("🔴 Socket error:", error);
      setError(`Socket error: ${error}`);
    });

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT);
      socket.off(SOCKET_EVENTS.DISCONNECT);
      socket.off(SOCKET_EVENTS.RECONNECT);
      socket.off(SOCKET_EVENTS.JOINED);
      socket.off(SOCKET_EVENTS.READY);
      socket.off(SOCKET_EVENTS.SIGNAL);
      socket.off(SOCKET_EVENTS.ERROR);
      socket.disconnect();
      console.log("🧹 Socket cleaned up");
    };
  }, []);

  // ============ HELPER: FETCH WITH ERROR HANDLING ============
  const fetchWithErrorHandling = async (
    url: string,
    options?: RequestInit
  ): Promise<Response> => {
    try {
      const res = await fetch(url, options);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      return res;
    } catch (err: any) {
      console.error("Fetch error:", err);
      throw err;
    }
  };

  // ============ HELPER: PERMISSION ERROR MESSAGE ============
  const getPermissionErrorMessage = (err: any): string => {
    if (err.name === "NotAllowedError") {
      return "Camera/Microphone permission denied. Please allow access in browser settings.";
    } else if (err.name === "NotFoundError") {
      return "No camera or microphone found on this device.";
    } else if (err.name === "NotReadableError") {
      return "Camera/Microphone is in use by another application.";
    }
    return `Failed to access camera/microphone: ${err.message}`;
  };

  // ============ CREATE MEETING ============
  const createMeeting = async () => {
    if (isCreatingMeeting) return;
    setIsCreatingMeeting(true);
    setError(null);

    try {
      const res = await fetchWithErrorHandling(`${HTTP_SERVER}/meeting/create`);
      const data = await res.json();

      if (!data.room_id) {
        throw new Error("No room_id in response");
      }

      setRoomId(data.room_id);
      alert(`✅ Meeting created: ${data.room_id}`);
      console.log("Meeting created successfully:", data.room_id);
    } catch (err: any) {
      const errorMsg = `Failed to create meeting: ${err.message}`;
      console.error(errorMsg);
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  // ============ JOIN MEETING ============
  const joinMeeting = async () => {
    if (!roomId.trim()) {
      setError("Enter room ID first");
      alert("Enter room ID first");
      return;
    }

    if (isJoining) return;
    setIsJoining(true);
    setError(null);

    try {
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        }),
        new Promise<MediaStream>((_, reject) =>
          setTimeout(() => reject(new Error("getUserMedia timeout")), 10000)
        ),
      ]);

      mediaStreamRef.current = stream;
      setMyStream(stream);

      if (myVideo.current) {
        myVideo.current.srcObject = stream;
      }

      socketRef.current?.emit(SOCKET_EVENTS.JOIN_ROOM, { room: roomId });

      socketRef.current?.once(SOCKET_EVENTS.ROOM_USERS, (count: number) => {
        console.log(`👥 Users in room: ${count}`);
        if (count === 2) {
          socketRef.current?.emit(SOCKET_EVENTS.ROOM_READY, { room: roomId });
        }
      });

      setJoined(true);
      console.log("✅ Joined meeting successfully");
    } catch (err: any) {
      const errorMsg = getPermissionErrorMessage(err);
      console.error(errorMsg);
      setError(errorMsg);
      alert(errorMsg);

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        setMyStream(null);
      }
    } finally {
      setIsJoining(false);
    }
  };

  // ============ CREATE PEER CONNECTION ============
  const createPeerConnection = (initiator: boolean, incomingSignal?: any) => {
    console.log("Creating peer connection, initiator:", initiator);

    if (!myStream) {
      console.warn("⚠️ Cannot create peer: myStream is null");
      setError("Media stream not available");
      return;
    }

    const p = new Peer({
      initiator,
      trickle: false,
      stream: myStream,
      config: {
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun1.l.google.com:19302"] },
        ],
      },
    });

    p.on("signal", (data) => {
      console.log("📤 Sending signal");
      socketRef.current?.emit(SOCKET_EVENTS.SIGNAL, {
        room: roomId,
        signal: data,
      });
    });

    p.on("stream", (remoteStream) => {
      console.log("🎥 Remote stream received");
      if (peerVideo.current) {
        peerVideo.current.srcObject = remoteStream;
      }
    });

    if (incomingSignal) {
      p.signal(incomingSignal);
    } else if (pendingSignals.length > 0) {
      console.log(`Processing ${pendingSignals.length} queued signals`);
      pendingSignals.forEach((signal) => p.signal(signal));
      setPendingSignals([]);
    }

    p.on("error", (err) => {
      console.error("🔴 Peer error:", err);
      setError(`Peer connection error: ${err.message}`);
      p.destroy();
      peerRef.current = null;
      setPeer(null);
    });

    p.on("close", () => {
      console.log("Peer connection closed");
      peerRef.current = null;
      setPeer(null);
    });

    peerRef.current = p;
    setPeer(p);
  };

  // ============ START RECORDING ============
  const startRecording = async () => {
    if (!myStream) {
      setError("Join meeting first!");
      alert("Join meeting first!");
      return;
    }

    try {
      const mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`${mimeType} not supported, using default`);
      }

      chunksRef.current = [];
      const recorder = new MediaRecorder(myStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = (e) => {
        console.error("Recording error:", e);
        setError(`Recording error: ${e.error}`);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        recordedBlobRef.current = blob;
        await uploadAudioAndTranscribe(blob);
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      alert("🎙 Recording started...");
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError(`Failed to start recording: ${err.message}`);
      alert(`Recording error: ${err.message}`);
    }
  };

  // ============ STOP RECORDING ============
  const stopRecording = () => {
    if (!recorderRef.current) {
      setError("No recording in progress");
      return;
    }
    recorderRef.current.stop();
    setIsRecording(false);
    alert("🛑 Recording stopped, uploading...");
  };

  // ============ UPLOAD & TRANSCRIBE ============
  const uploadAudioAndTranscribe = async (audioBlob: Blob, isRetry = false) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", audioBlob, "meeting_audio.webm");

      const res = await fetchWithErrorHandling(
        `${HTTP_SERVER}/transcription/upload`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res.json();
      const transcriptText = data.transcript || "No transcript";
      setTranscript(transcriptText);
      console.log("Transcription received:", transcriptText);

      const evalRes = await fetchWithErrorHandling(
        `${HTTP_SERVER}/assessment/evaluate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcriptText }),
        }
      );

      const evalData = await evalRes.json();
      const score = evalData.overall_score || "N/A";
      alert(`✅ Evaluation complete. Score: ${score}`);
      console.log("Evaluation score:", score);

      recordedBlobRef.current = null;
    } catch (e: any) {
      console.error("Error during transcription/evaluation:", e);
      const errorMsg = `Transcription/Evaluation failed: ${e.message}`;
      setError(errorMsg);

      if (!isRetry && recordedBlobRef.current) {
        const retry = window.confirm(
          `${errorMsg}\n\nRetry uploading the recorded audio?`
        );
        if (retry) {
          console.log("Retrying upload...");
          return uploadAudioAndTranscribe(recordedBlobRef.current, true);
        }
      }

      alert(`❌ ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  // ============ END MEETING ============
  const endMeeting = () => {
    try {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
        setPeer(null);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped track: ${track.kind}`);
        });
        mediaStreamRef.current = null;
        setMyStream(null);
      }

      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
        setIsRecording(false);
      }

      socketRef.current?.emit(SOCKET_EVENTS.LEAVE_ROOM, { room: roomId });

      setJoined(false);
      alert("Meeting ended");
      console.log("Meeting ended");
    } catch (err: any) {
      console.error("Error ending meeting:", err);
      setError(`Error ending meeting: ${err.message}`);
    }
  };

  // ============ UI RENDER ============
  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <h2 className="text-2xl font-bold text-[#1A4D2E] mb-2">🎥 Live Interview</h2>

      {/* CONNECTION STATUS */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            socketConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-600">
          {socketConnected ? "✅ Connected" : "❌ Disconnected"}
        </span>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ⚠️ {error}
        </div>
      )}

      {/* CONTROLS */}
      <div className="mt-4 flex gap-3 items-center flex-wrap">
        <button
          onClick={createMeeting}
          disabled={isCreatingMeeting || !socketConnected}
          className="px-4 py-2 bg-[#1A4D2E] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0d3a23]"
        >
          {isCreatingMeeting ? "Creating..." : "Create"}
        </button>

        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
          className="border px-3 py-2 rounded w-48 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
        />

        <button
          onClick={joinMeeting}
          disabled={isJoining || !socketConnected || joined}
          className="px-4 py-2 bg-[#1A4D2E] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0d3a23]"
        >
          {isJoining ? "Joining..." : joined ? "Joined" : "Join"}
        </button>

        <button
          onClick={startRecording}
          disabled={!joined || isRecording || uploading}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
        >
          {isRecording ? "Recording..." : "Start Rec"}
        </button>

        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
        >
          Stop & Transcribe
        </button>

        <button
          onClick={endMeeting}
          disabled={!joined}
          className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
        >
          End
        </button>
      </div>

      {/* VIDEO STREAMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="font-semibold text-[#1A4D2E] mb-2">You</h3>
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            className="w-full border rounded bg-black aspect-video object-cover"
          />
        </div>
        <div>
          <h3 className="font-semibold text-[#1A4D2E] mb-2">Partner</h3>
          <video
            ref={peerVideo}
            autoPlay
            playsInline
            className="w-full border rounded bg-black aspect-video object-cover"
          />
        </div>
      </div>

      {/* TRANSCRIPT */}
      <div className="mt-6 bg-white p-4 rounded border shadow">
        <h3 className="font-semibold text-[#1A4D2E]">📝 Transcript</h3>
        <div className="mt-2 whitespace-pre-wrap text-gray-700 min-h-[120px] max-h-[300px] overflow-y-auto bg-gray-50 p-3 rounded border">
          {transcript || "No transcript yet"}
        </div>
        {uploading && (
          <div className="mt-2 text-yellow-600">
            ⏳ Uploading / transcribing... (This may take a moment)
          </div>
        )}
      </div>
    </div>
  );
}

//ye working h 

// import React, { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
// import Peer from "simple-peer";
// import { useNavigate } from "react-router-dom";

// const SIGNALING_SERVER = "http://192.168.0.120:8000";
// const HTTP_SERVER = "http://192.168.0.120:8000"; // use your backend IP
// // const socket = io(SIGNALING_SERVER, { autoConnect: false });
// const socket = io(SIGNALING_SERVER, {

//   transports: ["websocket"],

//   withCredentials: true,

//   reconnectionAttempts: 5,

// });

// export default function LiveInterview() {
//   const [roomId, setRoomId] = useState("");
//   const [createdRoom, setCreatedRoom] = useState("");
//   const [joined, setJoined] = useState(false);
//   const [myStream, setMyStream] = useState<MediaStream | null>(null);
//   const [peer, setPeer] = useState<Peer.Instance | null>(null);
//   const [transcript, setTranscript] = useState("");
//   const [uploading, setUploading] = useState(false);
//   const myVideo = useRef<HTMLVideoElement>(null);
//   const peerVideo = useRef<HTMLVideoElement>(null);
//   const recorderRef = useRef<MediaRecorder | null>(null);
//   const chunksRef = useRef<Blob[]>([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     socket.connect();

//     socket.on("connect", () => console.log("Socket connected:", socket.id));
//     socket.on("signal", (payload) => peer?.signal(payload.signal));
//     socket.on("user_joined", (d) => console.log("User joined:", d));

//     return () => socket.disconnect();
//   }, [peer]);

//   const createMeeting = async () => {
//     try {
//       const res = await fetch(`${HTTP_SERVER}/meeting/create`);
//       const data = await res.json();
//       setCreatedRoom(data.room_id);
//       setRoomId(data.room_id);
//       alert(`✅ Meeting created: ${data.room_id}`);
//     } catch {
//       alert("Failed to create meeting");
//     }
//   };

//   const joinMeeting = async () => {
//     if (!roomId) return alert("Enter room ID");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//       setMyStream(stream);
//       if (myVideo.current) myVideo.current.srcObject = stream;
//       socket.emit("join_room", { room: roomId });

//       const p = new Peer({ initiator: true, trickle: false, stream });
//       p.on("signal", (data) => socket.emit("signal", { room: roomId, signal: data }));
//       p.on("stream", (remoteStream) => {
//         if (peerVideo.current) peerVideo.current.srcObject = remoteStream;
//       });
//       p.on("error", (e) => console.error("Peer error:", e));

//       setPeer(p);
//       setJoined(true);
//     } catch {
//       alert("Failed to access camera or join meeting");
//     }
//   };

//   const startRecording = () => {
//     if (!myStream) return alert("Join meeting first!");
//     chunksRef.current = [];
//     const recorder = new MediaRecorder(myStream, { mimeType: "audio/webm" });

//     recorder.ondataavailable = (e) => {
//       if (e.data.size > 0) chunksRef.current.push(e.data);
//     };

//     recorder.onstop = async () => {
//       const blob = new Blob(chunksRef.current, { type: "audio/webm" });
//       await uploadAudioAndTranscribe(blob);
//     };

//     recorder.start();
//     recorderRef.current = recorder;
//     alert("🎙️ Recording started...");
//   };

//   const stopRecording = () => {
//     if (!recorderRef.current) return;
//     recorderRef.current.stop();
//     alert("🛑 Recording stopped, uploading...");
//   };

//   const uploadAudioAndTranscribe = async (audioBlob: Blob) => {
//     setUploading(true);
//     try {
//       const form = new FormData();
//       form.append("file", audioBlob, "meeting_audio.webm");
//       const res = await fetch(`${HTTP_SERVER}/transcription/upload`, { method: "POST", body: form });
//       const data = await res.json();
//       const transcriptText = data.transcript || "No transcript";
//       setTranscript(transcriptText);

//       const evalRes = await fetch(`${HTTP_SERVER}/assessment/evaluate`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ transcript: transcriptText }),
//       });
//       const evalData = await evalRes.json();
//       alert(`✅ Evaluation complete. Score: ${evalData.overall_score || "N/A"}`);
//     } catch (e) {
//       console.error(e);
//       alert("❌ Transcription or evaluation failed");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const endMeeting = () => {
//     if (peer) peer.destroy();
//     myStream?.getTracks().forEach((t) => t.stop());
//     setPeer(null);
//     setJoined(false);
//     socket.emit("leave_room", { room: roomId });
//     alert("Meeting ended");
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold text-[#1A4D2E]">🎥 Live Interview</h2>

//       <div className="mt-4 flex gap-3 items-center flex-wrap">
//         <button onClick={createMeeting} className="px-4 py-2 bg-[#1A4D2E] text-white rounded">Create</button>
//         <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID"
//           className="border px-3 py-2 rounded w-48 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]" />
//         <button onClick={joinMeeting} className="px-4 py-2 bg-[#1A4D2E] text-white rounded">Join</button>
//         <button onClick={startRecording} disabled={!joined} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Start Rec</button>
//         <button onClick={stopRecording} className="px-4 py-2 bg-red-600 text-white rounded">Stop & Transcribe</button>
//         <button onClick={endMeeting} className="px-4 py-2 bg-gray-600 text-white rounded">End</button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
//         <div>
//           <h3 className="font-semibold">You</h3>
//           <video ref={myVideo} autoPlay muted playsInline className="w-full border rounded bg-black" />
//         </div>
//         <div>
//           <h3 className="font-semibold">Partner</h3>
//           <video ref={peerVideo} autoPlay playsInline className="w-full border rounded bg-black" />
//         </div>
//       </div>

//       <div className="mt-6 bg-gray-50 p-4 rounded border">
//         <h3 className="font-semibold text-[#1A4D2E]">Transcript</h3>
//         <div className="mt-2 whitespace-pre-wrap text-gray-700 min-h-[120px] max-h-[300px] overflow-y-auto bg-white p-3 rounded border">
//           {transcript || "No transcript yet"}
//         </div>
//         {uploading && <div className="mt-2 text-yellow-600">⏳ Uploading / transcribing...</div>}
//       </div>
//     </div>
//   );
// }




// // prototype_ai-assessmate/src/pages/LiveInterview.tsx
// import React, { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
// import Peer from "simple-peer";
// import { useNavigate } from "react-router-dom";

// const SIGNALING_SERVER = "http://192.168.0.120:8000/ws"; // adjust if different
// const HTTP_SERVER = "http://localhost:8000";

// const socket = io(SIGNALING_SERVER, { autoConnect: false });

// export default function LiveInterview() {
//   const [roomId, setRoomId] = useState("");
//   const [createdRoom, setCreatedRoom] = useState("");
//   const [joined, setJoined] = useState(false);
//   const [myStream, setMyStream] = useState<MediaStream | null>(null);
//   const [peer, setPeer] = useState<Peer.Instance | null>(null);
//   const [transcript, setTranscript] = useState("");
//   const [uploading, setUploading] = useState(false);
//   const myVideo = useRef<HTMLVideoElement>(null);
//   const peerVideo = useRef<HTMLVideoElement>(null);
//   const recorderRef = useRef<MediaRecorder | null>(null);
//   const chunksRef = useRef<Blob[]>([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // connect when component mounts for signaling
//     socket.connect();

//     socket.on("connect", () => {
//       console.log("socket connected", socket.id);
//     });

//     socket.on("joined", (payload) => {
//       console.log("joined room event", payload);
//     });

//     socket.on("signal", (payload) => {
//       // payload: { signal, from }
//       if (peer) {
//         peer.signal(payload.signal);
//       }
//     });

//     return () => {
//       socket.disconnect();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const createMeeting = async () => {
//     try {
//       const res = await fetch(`${HTTP_SERVER}/meeting/create`);
//       const data = await res.json();
//       setCreatedRoom(data.room_id);
//       setRoomId(data.room_id);
//       alert(`Meeting created: ${data.room_id}`);
//     } catch (err) {
//       console.error("Error creating meeting:", err);
//       alert("Failed to create meeting");
//     }
//   };

//   const joinMeeting = async () => {
//     if (!roomId) return alert("Enter room ID");
    
//     try {
//       // get media
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//       setMyStream(stream);
//       if (myVideo.current) myVideo.current.srcObject = stream;

//       // notify server to join room
//       socket.emit("join_room", { room: roomId });

//       // create peer (initiator true if you want to start the offer)
//       const p = new Peer({ initiator: true, trickle: false, stream });
      
//       p.on("signal", (data) => {
//         // send offer/answer to signaling server
//         socket.emit("signal", { room: roomId, signal: data });
//       });
      
//       p.on("stream", (remoteStream) => {
//         if (peerVideo.current) peerVideo.current.srcObject = remoteStream;
//       });
      
//       p.on("error", (err) => console.error("Peer error", err));

//       // when remote signals come in socket.on('signal', ...) will call p.signal
//       setPeer(p);
//       setJoined(true);
//     } catch (err) {
//       console.error("Error joining meeting:", err);
//       alert("Failed to access camera/microphone or join room");
//     }
//   };

//   // Recording: keep pushing chunks (we will upload entire recording at stop)
//   const startRecording = () => {
//     if (!myStream) return alert("Start/join meeting first");
//     chunksRef.current = [];
//     const recorder = new MediaRecorder(myStream);
    
//     recorder.ondataavailable = (e) => {
//       if (e.data && e.data.size > 0) {
//         chunksRef.current.push(e.data);
//       }
//     };
    
//     recorder.onstop = async () => {
//       const blob = new Blob(chunksRef.current, { type: "audio/webm" });
//       await uploadAudioAndTranscribe(blob);
//     };
    
//     recorder.start();
//     recorderRef.current = recorder;
//     alert("Recording started");
//   };

//   const stopRecording = () => {
//     if (!recorderRef.current) return;
//     recorderRef.current.stop();
//     alert("Recording stopped: uploading for transcription...");
//   };

//   const uploadAudioAndTranscribe = async (audioBlob: Blob) => {
//     setUploading(true);
//     try {
//       const form = new FormData();
//       form.append("file", audioBlob, "meeting_audio.webm");
      
//       const res = await fetch(`${HTTP_SERVER}/transcription/upload`, { 
//         method: "POST", 
//         body: form 
//       });
      
//       const data = await res.json();
//       const transcriptText = data.transcript || data.trans || "No transcript returned";
//       setTranscript(transcriptText);
      
//       // Now call evaluation endpoint
//       const evalRes = await fetch(`${HTTP_SERVER}/assessment/evaluate`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ transcript: transcriptText })
//       });
      
//       const evalData = await evalRes.json();
//       console.log("Evaluation:", evalData);
      
//       const score = evalData.overall_score !== undefined ? evalData.overall_score : "N/A";
//       alert(`Evaluation ready — Score: ${score}`);
      
//       // if you have a view results route, navigate there with returned id
//       // navigate(`/view-results/${evalData.assessment_id || 0}`);
//     } catch (err) {
//       console.error("Upload/transcription error", err);
//       alert("Transcription failed. See console.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const endMeeting = () => {
//     // cleanup peers and streams
//     if (peer) {
//       try { 
//         peer.destroy(); 
//       } catch (e) {
//         console.error("Error destroying peer:", e);
//       }
//       setPeer(null);
//     }
    
//     if (myStream) {
//       myStream.getTracks().forEach(t => t.stop());
//       setMyStream(null);
//     }
    
//     setJoined(false);
//     socket.emit("leave_room", { room: roomId });
//     setRoomId("");
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold text-[#1A4D2E]">Live Interview</h2>

//       <div className="mt-4 flex gap-3 items-center flex-wrap">
//         <button 
//           onClick={createMeeting} 
//           className="px-4 py-2 bg-[#1A4D2E] text-white rounded hover:bg-[#0f3620] transition"
//         >
//           Create
//         </button>
        
//         <input 
//           value={roomId} 
//           onChange={(e) => setRoomId(e.target.value)} 
//           className="border px-3 py-2 rounded w-48 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]" 
//           placeholder="Room ID" 
//         />
        
//         <button 
//           onClick={joinMeeting} 
//           className="px-4 py-2 bg-[#1A4D2E] text-white rounded hover:bg-[#0f3620] transition"
//         >
//           Join
//         </button>
        
//         <button 
//           onClick={startRecording} 
//           disabled={!joined}
//           className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           Start Recording
//         </button>
        
//         <button 
//           onClick={stopRecording} 
//           className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
//         >
//           Stop & Transcribe
//         </button>
        
//         <button 
//           onClick={endMeeting} 
//           className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
//         >
//           End Meeting
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800">You</h3>
//           <video 
//             ref={myVideo} 
//             autoPlay 
//             muted 
//             playsInline 
//             className="w-full border rounded bg-black" 
//           />
//         </div>
        
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800">Partner</h3>
//           <video 
//             ref={peerVideo} 
//             autoPlay 
//             playsInline 
//             className="w-full border rounded bg-black" 
//           />
//         </div>
//       </div>

//       <div className="mt-6 bg-gray-50 p-4 rounded border">
//         <h3 className="font-semibold text-[#1A4D2E]">Transcript (post-call)</h3>
//         <div className="mt-2 whitespace-pre-wrap text-gray-700 min-h-[120px] max-h-[300px] overflow-y-auto bg-white p-3 rounded border">
//           {transcript || "No transcript yet"}
//         </div>
//         {uploading && <div className="mt-2 text-sm text-yellow-600 font-medium">⏳ Uploading / transcribing...</div>}
//       </div>
//     </div>
//   );
// }
