// import { Mic, Square, Upload, Loader, AlertCircle, FileAudio, X } from "lucide-react";
// import { useRef, useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Alert, AlertDescription } from "@/components/ui/alert";

// interface RecordingInterfaceProps {
//   onFileSelected: (file: File) => void;
//   loading?: boolean;
//   error?: string;
// }

// export default function RecordingInterface({ 
//   onFileSelected, 
//   loading = false, 
//   error = "" 
// }: RecordingInterfaceProps) {
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const audioChunksRef = useRef<Blob[]>([]);
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingTime, setRecordingTime] = useState(0);
//   const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [micError, setMicError] = useState("");
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);

//   useEffect(() => {
//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [intervalId]);

//   const startRecording = async () => {
//     try {
//       setMicError("");
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mediaRecorder = new MediaRecorder(stream, {
//         mimeType: "audio/webm",
//       });

//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => {
//         audioChunksRef.current.push(event.data);
//       };

//       mediaRecorder.onstop = () => {
//         const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
//         const file = new File([audioBlob], `recording_${Date.now()}.wav`, {
//           type: "audio/wav",
//         });
//         onFileSelected(file);
//       };

//       mediaRecorder.start();
//       setIsRecording(true);

//       const id = setInterval(() => {
//         setRecordingTime((prev) => prev + 1);
//       }, 1000);
//       setIntervalId(id);
//     } catch (err) {
//       setMicError("Unable to access microphone. Please check permissions.");
//       console.error("Error accessing microphone:", err);
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current) {
//       mediaRecorderRef.current.stop();
//       mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
//       setIsRecording(false);
//       setRecordingTime(0);
//       if (intervalId) clearInterval(intervalId);
//       setIntervalId(null);
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setMicError("");
//       setSelectedFile(file);
//       onFileSelected(file);
//     }
//   };

//   const formatFileName = (fileName: string) => {
//     return fileName.length > 30 ? fileName.substring(0, 27) + "..." : fileName;
//   };

//   const clearSelectedFile = () => {
//     setSelectedFile(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, "0")}`;
//   };

//   return (
//     <div className="space-y-6">
//       {(micError || error) && (
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{micError || error}</AlertDescription>
//         </Alert>
//       )}

//       <div className="space-y-6">
//         <div className="text-center space-y-2">
//           <h2 className="text-3xl font-bold text-foreground">Interview Setup</h2>
//           <p className="text-muted-foreground">Choose your preferred method to record the interview</p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           {/* Record Interview Option */}
//           <div className="bg-card border border-border rounded-xl p-8 space-y-6 shadow-lg hover:shadow-xl transition-shadow">
//             <div className="flex flex-col items-center space-y-4">
//               <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
//                 <Mic className="h-10 w-10 text-primary" />
//               </div>
//               <div className="text-center">
//                 <h3 className="text-xl font-bold text-foreground">Record Interview</h3>
//                 <p className="text-sm text-muted-foreground mt-2">
//                   Real-time recording with live transcription
//                 </p>
//               </div>
//             </div>

//             {isRecording && (
//               <div className="flex items-center justify-center gap-3 py-4 bg-destructive/10 rounded-lg">
//                 <span className="relative flex h-3 w-3">
//                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
//                   <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
//                 </span>
//                 <span className="font-mono font-bold text-foreground text-lg">
//                   {formatTime(recordingTime)}
//                 </span>
//               </div>
//             )}

//             {!isRecording ? (
//               <Button
//                 onClick={startRecording}
//                 disabled={loading || isRecording}
//                 className="w-full h-12 bg-primary hover:bg-primary-dark text-primary-foreground"
//                 size="lg"
//               >
//                 <Mic className="h-5 w-5 mr-2" />
//                 Start Recording
//               </Button>
//             ) : (
//               <Button
//                 onClick={stopRecording}
//                 className="w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
//                 size="lg"
//               >
//                 <Square className="h-5 w-5 mr-2" />
//                 Stop Recording
//               </Button>
//             )}
//           </div>

//           {/* Upload Audio Option */}
//           <div className="bg-card border border-border rounded-xl p-8 space-y-6 shadow-lg hover:shadow-xl transition-shadow">
//             <div className="flex flex-col items-center space-y-4">
//               <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
//                 <Upload className="h-10 w-10 text-accent-dark" />
//               </div>
//               <div className="text-center">
//                 <h3 className="text-xl font-bold text-foreground">Upload Audio File</h3>
//                 <p className="text-sm text-muted-foreground mt-2">
//                   WAV, MP3, M4A, OGG, WEBM, FLAC
//                 </p>
//               </div>
//             </div>

//             {selectedFile && (
//               <div className="bg-accent/10 border border-accent rounded-lg p-4">
//                 <div className="flex items-start justify-between gap-3">
//                   <div className="flex items-start gap-3 flex-1 min-w-0">
//                     <FileAudio className="h-5 w-5 text-accent-dark flex-shrink-0 mt-0.5" />
//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium text-foreground truncate">
//                         {formatFileName(selectedFile.name)}
//                       </p>
//                       <p className="text-sm text-muted-foreground">
//                         {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
//                       </p>
//                     </div>
//                   </div>
//                   <Button
//                     type="button"
//                     onClick={clearSelectedFile}
//                     variant="ghost"
//                     size="icon"
//                     className="flex-shrink-0 h-8 w-8"
//                   >
//                     <X className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             )}

//             <Button
//               onClick={() => fileInputRef.current?.click()}
//               disabled={loading}
//               className="w-full h-12 bg-accent hover:bg-accent-dark text-accent-foreground"
//               size="lg"
//             >
//               {loading ? (
//                 <>
//                   <Loader className="h-5 w-5 mr-2 animate-spin" />
//                   Processing...
//                 </>
//               ) : selectedFile ? (
//                 <>
//                   <Upload className="h-5 w-5 mr-2" />
//                   Choose Different File
//                 </>
//               ) : (
//                 <>
//                   <Upload className="h-5 w-5 mr-2" />
//                   Choose File
//                 </>
//               )}
//             </Button>

//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="audio/*"
//               onChange={handleFileUpload}
//               className="hidden"
//               disabled={loading}
//             />
//           </div>
//         </div>

//         <div className="flex items-center justify-center gap-4 py-4">
//           <div className="h-px flex-1 bg-border"></div>
//           <span className="text-sm text-muted-foreground font-medium px-3">OR</span>
//           <div className="h-px flex-1 bg-border"></div>
//         </div>
//       </div>
//     </div>
//   );
// }
