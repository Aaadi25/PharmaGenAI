import { configureStore } from "@reduxjs/toolkit";
import complaintReducer from "./complaintSlice";
import aiChatReducer from "./aiChatSlice";

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    aiChat: aiChatReducer,
  },
});
