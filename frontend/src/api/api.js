import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const extractFromDocument = async ({ file, text }) => {
  const form = new FormData();
  if (file) form.append("file", file);
  if (text) form.append("text", text);
  const { data } = await api.post("/complaints/extract", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const saveComplaint = async (payload) => {
  const { data } = await api.post("/complaints", payload);
  return data;
};

export const listComplaints = async () => {
  const { data } = await api.get("/complaints");
  return data;
};

export const chatWithAssistant = async (message, complaintContext) => {
  const { data } = await api.post("/assistant/chat", {
    message,
    complaint_context: complaintContext,
  });
  return data;
};

export default api;
