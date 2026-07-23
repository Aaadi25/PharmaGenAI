import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { chatWithAssistant } from "../api/api";

export const sendChatMessage = createAsyncThunk(
  "aiChat/sendChatMessage",
  async (message, { getState }) => {
    const { form } = getState().complaint;
    const reply = await chatWithAssistant(message, form);
    return { message, reply: reply.reply };
  }
);

const aiChatSlice = createSlice({
  name: "aiChat",
  initialState: {
    messages: [
      {
        role: "assistant",
        text: "Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.",
      },
    ],
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state, action) => {
        state.messages.push({ role: "user", text: action.meta.arg });
        state.status = "loading";
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.messages.push({ role: "assistant", text: action.payload.reply });
        state.status = "idle";
      })
      .addCase(sendChatMessage.rejected, (state) => {
        state.messages.push({
          role: "assistant",
          text: "Sorry, I couldn't reach the AI service. Please check the backend/Groq API key configuration.",
        });
        state.status = "idle";
      });
  },
});

export default aiChatSlice.reducer;
