import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Sparkles, UploadCloud, FileText, CheckCircle2, Bot, User, Send,
} from "lucide-react";
import { runExtraction } from "../store/complaintSlice";
import { sendChatMessage } from "../store/aiChatSlice";

export default function AIAssistantPanel() {
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [chatInput, setChatInput] = useState("");

  const { extractionStatus, extractionProgress, ai } = useSelector((s) => s.complaint);
  const { messages, status: chatStatus } = useSelector((s) => s.aiChat);

  const handleFile = (file) => {
    if (!file) return;
    dispatch(runExtraction({ file }));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const submitPastedText = () => {
    if (!pastedText.trim()) return;
    dispatch(runExtraction({ text: pastedText }));
    setPasteMode(false);
  };

  const submitChat = () => {
    if (!chatInput.trim()) return;
    dispatch(sendChatMessage(chatInput));
    setChatInput("");
  };

  return (
    <div className="card">
      <div className="ai-panel-header">
        <div className="title"><Sparkles size={17} /> AI Complaint Intake Assistant</div>
        <span className="beta-tag">BETA</span>
      </div>

      <div
        className={`dropzone ${dragOver ? "dragover" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <UploadCloud size={26} strokeWidth={1.6} />
        <div>Drag &amp; drop complaint document here</div>
        <a>or click to browse</a>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.docx,.txt,.eml"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="or-divider">OR</div>

      {!pasteMode ? (
        <button className="paste-btn" onClick={() => setPasteMode(true)}>
          <FileText size={15} /> Paste Complaint Text / Email
        </button>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <textarea
            rows={5}
            style={{ width: "100%", fontFamily: "inherit", fontSize: 13, padding: 10, borderRadius: 9, border: "1px solid #e3e5e9", background: "#f7f8fa" }}
            placeholder="Paste complaint email or text here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn-primary" onClick={submitPastedText}>Extract</button>
            <button className="btn-secondary" onClick={() => setPasteMode(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="support-note">
        <CheckCircle2 size={15} />
        <span>
          Supported formats: PDF, DOCX, TXT, EML
          <br />
          Max file size: 10MB
        </span>
      </div>

      <div className="progress-label">
        <span>EXTRACTION PROGRESS</span>
        <span>{extractionProgress}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${extractionProgress}%` }} />
      </div>
      <p className="progress-note">
        {extractionStatus === "loading" && "Analyzing document content and extracting key details... Please wait, this may take a few moments."}
        {extractionStatus === "succeeded" && "Extraction complete. Review the populated fields for accuracy."}
        {extractionStatus === "failed" && "Extraction failed. Check that the backend is running and GROQ_API_KEY is set."}
        {extractionStatus === "idle" && "Waiting for a document or pasted text."}
      </p>

      {ai.summary && (
        <div className="insight-card">
          <h4>AI Summary</h4>
          <p style={{ margin: 0 }}>{ai.summary}</p>
        </div>
      )}

      {ai.completeness && (
        <div className="insight-card">
          <h4>Completeness Check — {ai.completeness.score}%</h4>
          {ai.completeness.missing_fields?.length > 0 && (
            <ul>{ai.completeness.missing_fields.map((f) => <li key={f}>{f}</li>)}</ul>
          )}
          {ai.completeness.notes && <p style={{ margin: "4px 0 0" }}>{ai.completeness.notes}</p>}
        </div>
      )}

      {ai.rootCause && ai.rootCause.length > 0 && (
        <div className="insight-card">
          <h4>Root Cause Suggestions</h4>
          <ul>
            {ai.rootCause.map((r, i) => (
              <li key={i}>{r.cause} <em style={{ color: "#9ca3af" }}>({r.category}, {r.confidence})</em></li>
            ))}
          </ul>
        </div>
      )}

      {ai.capa && ai.capa.length > 0 && (
        <div className="insight-card">
          <h4>CAPA Recommendations</h4>
          <ul>
            {ai.capa.map((c, i) => (
              <li key={i}><strong>Corrective:</strong> {c.corrective_action}<br /><strong>Preventive:</strong> {c.preventive_action}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="section-title" style={{ marginTop: 20 }}>AI Assistant</div>
      <div>
        {messages.map((m, i) => (
          <div className={`ai-msg ${m.role === "user" ? "user" : ""}`} key={i}>
            {m.role === "assistant" ? <Bot size={15} /> : <User size={15} />}
            <span>{m.text}</span>
          </div>
        ))}
        {chatStatus === "loading" && (
          <div className="ai-msg"><Bot size={15} /><span>Thinking...</span></div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          placeholder="Ask me anything about this complaint..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitChat()}
        />
        <button className="send-btn" onClick={submitChat}><Send size={15} /></button>
      </div>
      <p className="disclaimer">AI responses may contain errors. Please verify information.</p>
    </div>
  );
}
