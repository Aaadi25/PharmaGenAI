import { ShieldCheck } from "lucide-react";
import ComplaintForm from "./components/ComplaintForm";
import AIAssistantPanel from "./components/AIAssistantPanel";

export default function App() {
  return (
    <div className="app-shell">
      <div className="app-header">
        <ShieldCheck size={22} color="#4338ca" />
        <h1>AIVOA Complaint Management System</h1>
      </div>
      <div className="grid">
        <ComplaintForm />
        <AIAssistantPanel />
      </div>
    </div>
  );
}
