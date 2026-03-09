import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, CheckCircle, FileAudio, Mic, Square } from 'lucide-react';
import { uploadAudio, transcribeInterview } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const RecordInterview = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [transcribeProgress, setTranscribeProgress] = useState({ segments: 0, qaPairs: 0 });

  // Timer control
  useEffect(() => {
    let timer;
    if (recording) {
      timer = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else {
      clearInterval(timer);
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [recording]);

  // Start mic recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(file);
        toast({
          title: 'Recording Complete',
          description: 'Your audio recording is ready to upload.',
        });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (error) {
      toast({
        title: 'Microphone Access Denied',
        description: 'Please allow microphone permissions to record audio.',
        variant: 'destructive',
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setRecording(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['audio/mp3', 'audio/wav', 'audio/webm', 'audio/mpeg', 'audio/x-wav', 'audio/mp4',      // ✅ for .m4a files
  'audio/x-m4a', 'audio/mpeg', 'video/mp4', 'video/mov', 'video/avi', 'video/x-matroska'  ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an MP3, WAV, WEBM, MPEG audio file or MP4, MOV, AVI video file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !candidateId) {
      toast({
        title: 'No Audio Selected',
        description: 'Please record or upload an audio file first.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const response = await uploadAudio(candidateId, selectedFile);
      const newInterviewId = response.data.interview_id;
      setInterviewId(newInterviewId);
      toast({
        title: 'Upload Successful',
        description: 'Audio file uploaded successfully.',
      });
      setStep(2);
      await handleTranscribe(newInterviewId);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.detail || 'Failed to upload audio file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTranscribe = async (id) => {
    setTranscribing(true);
    try {
      const response = await transcribeInterview(id);
      setTranscribeProgress({
        segments: response.data.segments_count || 0,
        qaPairs: response.data.qa_pairs_count || 0,
      });

      toast({
        title: 'Transcription Complete',
        description: 'Audio transcribed successfully. Redirecting...',
      });

      // ✅ navigate to results with correct route
      setTimeout(() => navigate(`/view-results/${id}`), 1000);
    } catch (error) {
      console.error('Transcription failed:', error);
      toast({
        title: 'Transcription Failed',
        description: error.response?.data?.detail || 'Failed to transcribe audio.',
        variant: 'destructive',
      });
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Record Interview</h1>
        <p className="text-muted-foreground mt-1">Record or upload interview audio for processing</p>
      </div>

      {/* Step 1: Record or Upload */}
      {step === 1 && (
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Upload className="h-5 w-5 text-accent" />
              <span>Record or Upload Interview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Mic Recording Section */}
            <div className="text-center border p-6 rounded-lg">
              <Mic className="h-10 w-10 text-accent mx-auto mb-4" />
              {recording ? (
                <>
                  <p className="text-lg font-medium text-foreground mb-2">Recording... {recordingTime}s</p>
                  <Button onClick={stopRecording} variant="destructive">
                    <Square className="mr-2 h-4 w-4" /> Stop Recording
                  </Button>
                </>
              ) : (
                <Button onClick={startRecording} className="bg-accent hover:bg-accent-dark text-accent-foreground">
                  <Mic className="mr-2 h-4 w-4" /> Start Recording
                </Button>
              )}
            </div>

            {/* Upload Section */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
             <input
  type="file"
  accept=".mp3,.wav,.webm,.m4a,.mpeg,.mp4,.mov,.avi,.mkv,audio/*,video/*"
  onChange={handleFileSelect}
  className="hidden"
  id="audio-upload"
/>

              <label htmlFor="audio-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Select Audio/Video File</span>
                </Button>
              </label>
              {selectedFile && <p className="mt-4 text-foreground font-medium">{selectedFile.name}</p>}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-accent hover:bg-accent-dark text-accent-foreground font-semibold"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload & Process'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Transcription */}
      {step === 2 && (
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Loader2 className="h-5 w-5 text-accent animate-spin" />
              <span>Processing Interview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto mb-4" />
            <p className="text-foreground text-lg font-medium">Transcribing audio...</p>
            <p className="text-muted-foreground mt-2">This may take a few minutes</p>
            {transcribeProgress.segments > 0 && (
              <div className="mt-6 space-y-1">
                <p className="text-sm text-muted-foreground">Segments: {transcribeProgress.segments}</p>
                <p className="text-sm text-muted-foreground">QA Pairs: {transcribeProgress.qaPairs}</p>
              </div>
            )}
            <Progress value={50} className="h-2 mt-4" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecordInterview;








// import { useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Progress } from '@/components/ui/progress';
// import { Upload, Loader2, CheckCircle, FileAudio } from 'lucide-react';
// import { uploadAudio, transcribeInterview, evaluateInterview } from '@/services/api';
// import { toast } from '@/hooks/use-toast';

// const RecordInterview = () => {
//   const { candidateId } = useParams();
//   const navigate = useNavigate();
  
//   const [step, setStep] = useState<1 | 2 | 3>(1);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [transcribing, setTranscribing] = useState(false);
//   const [evaluating, setEvaluating] = useState(false);
//   const [interviewId, setInterviewId] = useState<string | null>(null);
//   const [transcribeProgress, setTranscribeProgress] = useState({ segments: 0, qaPairs: 0 });

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       const validTypes = ['audio/mp3', 'audio/wav', 'audio/webm', 'audio/mpeg', 'audio/x-wav'];
      
//       if (!validTypes.includes(file.type)) {
//         toast({
//           title: 'Invalid File Type',
//           description: 'Please select an MP3, WAV, or WEBM audio file',
//           variant: 'destructive',
//         });
//         return;
//       }
      
//       setSelectedFile(file);
//     }
//   };

//   const handleUpload = async () => {
//     if (!selectedFile || !candidateId) return;

//     setUploading(true);
//     try {
//       const response = await uploadAudio(candidateId, selectedFile);
//       setInterviewId(response.data.interview_id);
//       toast({
//         title: 'Upload Successful',
//         description: 'Audio file uploaded successfully',
//       });
//       setStep(2);
//       handleTranscribe(response.data.interview_id);
//     } catch (error) {
//       console.error('Upload failed:', error);
//       toast({
//         title: 'Upload Failed',
//         description: 'Failed to upload audio file. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleTranscribe = async (id: string) => {
//     setTranscribing(true);
//     try {
//       const response = await transcribeInterview(id);
//       setTranscribeProgress({
//         segments: response.data.segments_count || 0,
//         qaPairs: response.data.qa_pairs_count || 0,
//       });
//       toast({
//         title: 'Transcription Complete',
//         description: 'Audio transcribed successfully',
//       });
//       setStep(3);
//       handleEvaluate(id);
//     } catch (error) {
//       console.error('Transcription failed:', error);
//       toast({
//         title: 'Transcription Failed',
//         description: 'Failed to transcribe audio. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setTranscribing(false);
//     }
//   };

//   const handleEvaluate = async (id: string) => {
//     setEvaluating(true);
//     try {
//       await evaluateInterview(id);
//       toast({
//         title: 'Evaluation Complete',
//         description: 'Interview evaluated successfully',
//       });
//       navigate(`/results/${candidateId}`);
//     } catch (error) {
//       console.error('Evaluation failed:', error);
//       toast({
//         title: 'Evaluation Failed',
//         description: 'Failed to evaluate interview. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setEvaluating(false);
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-foreground">Record Interview</h1>
//         <p className="text-muted-foreground mt-1">Upload and process interview audio</p>
//       </div>

//       <div className="mb-8">
//         <div className="flex items-center justify-between mb-4">
//           {[1, 2, 3].map((s) => (
//             <div key={s} className="flex items-center flex-1">
//               <div
//                 className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
//                   step >= s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
//                 }`}
//               >
//                 {step > s ? <CheckCircle className="h-5 w-5" /> : s}
//               </div>
//               {s < 3 && (
//                 <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-accent' : 'bg-muted'}`} />
//               )}
//             </div>
//           ))}
//         </div>
//         <div className="flex justify-between text-sm text-muted-foreground">
//           <span>Upload Audio</span>
//           <span>Transcribe</span>
//           <span>Evaluate</span>
//         </div>
//       </div>

//       {step === 1 && (
//         <Card className="border-border shadow-lg">
//           <CardHeader>
//             <CardTitle className="flex items-center space-x-2 text-foreground">
//               <Upload className="h-5 w-5 text-accent" />
//               <span>Upload Interview Audio</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
//               <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//               <input
//                 type="file"
//                 accept="audio/mp3,audio/wav,audio/webm,audio/mpeg,audio/x-wav"
//                 onChange={handleFileSelect}
//                 className="hidden"
//                 id="audio-upload"
//               />
//               <label htmlFor="audio-upload">
//                 <Button variant="outline" className="cursor-pointer" asChild>
//                   <span>Select Audio File</span>
//                 </Button>
//               </label>
//               {selectedFile && (
//                 <p className="mt-4 text-foreground font-medium">{selectedFile.name}</p>
//               )}
//               <p className="text-muted-foreground text-sm mt-2">Supported formats: MP3, WAV, WEBM</p>
//             </div>

//             <Button
//               onClick={handleUpload}
//               disabled={!selectedFile || uploading}
//               className="w-full bg-accent hover:bg-accent-dark text-accent-foreground font-semibold"
//             >
//               {uploading ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Uploading...
//                 </>
//               ) : (
//                 'Upload & Continue'
//               )}
//             </Button>
//           </CardContent>
//         </Card>
//       )}

//       {step === 2 && (
//         <Card className="border-border shadow-lg">
//           <CardHeader>
//             <CardTitle className="flex items-center space-x-2 text-foreground">
//               <Loader2 className="h-5 w-5 text-accent animate-spin" />
//               <span>Transcribing Audio</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             <div className="text-center py-8">
//               <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto mb-4" />
//               <p className="text-foreground text-lg font-medium">Processing audio file...</p>
//               <p className="text-muted-foreground mt-2">This may take 2-10 minutes</p>
              
//               {transcribeProgress.segments > 0 && (
//                 <div className="mt-6 space-y-2">
//                   <p className="text-sm text-muted-foreground">
//                     Segments: {transcribeProgress.segments}
//                   </p>
//                   <p className="text-sm text-muted-foreground">
//                     QA Pairs: {transcribeProgress.qaPairs}
//                   </p>
//                 </div>
//               )}
//             </div>
//             <Progress value={50} className="h-2" />
//           </CardContent>
//         </Card>
//       )}

//       {step === 3 && (
//         <Card className="border-border shadow-lg">
//           <CardHeader>
//             <CardTitle className="flex items-center space-x-2 text-foreground">
//               <Loader2 className="h-5 w-5 text-accent animate-spin" />
//               <span>Evaluating with AI</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             <div className="text-center py-8">
//               <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto mb-4" />
//               <p className="text-foreground text-lg font-medium">AI is analyzing the interview...</p>
//               <p className="text-muted-foreground mt-2">Generating comprehensive assessment</p>
//             </div>
//             <Progress value={75} className="h-2" />
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };

// export default RecordInterview;
