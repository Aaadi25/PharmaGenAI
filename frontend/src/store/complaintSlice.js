import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { extractFromDocument, saveComplaint } from "../api/api";

const emptyForm = {
  complaint_source: "",
  customer_name: "",
  product_name: "",
  product_strength_grade: "",
  batch_lot_number: "",
  manufacturing_date: "",
  expiry_date: "",
  quantity_affected: "",
  complaint_type: "",
  complaint_date: "",
  detailed_description: "",
  initial_severity: "",
  priority: "",
};

export const runExtraction = createAsyncThunk(
  "complaint/runExtraction",
  async ({ file, text }) => {
    return await extractFromDocument({ file, text });
  }
);

export const submitComplaint = createAsyncThunk(
  "complaint/submitComplaint",
  async (_, { getState }) => {
    const { form, ai } = getState().complaint;
    return await saveComplaint({
      ...form,
      status: "Pending Triage",
      ai_completeness: ai.completeness,
      ai_risk_classification: ai.risk,
      ai_root_cause_suggestions: ai.rootCause,
      ai_capa_recommendations: ai.capa,
      ai_summary: ai.summary,
      source_document_name: ai.sourceDocumentName,
      raw_extracted_text: ai.rawExtractedText,
    });
  }
);

const complaintSlice = createSlice({
  name: "complaint",
  initialState: {
    form: emptyForm,
    ai: {
      completeness: null,
      risk: null,
      rootCause: null,
      capa: null,
      summary: null,
      sourceDocumentName: null,
      rawExtractedText: null,
    },
    extractionStatus: "idle", // idle | loading | succeeded | failed
    extractionProgress: 0,
    saveStatus: "idle",
    lastSavedId: null,
  },
  reducers: {
    updateField(state, action) {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    resetForm(state) {
      state.form = emptyForm;
      state.ai = {
        completeness: null, risk: null, rootCause: null, capa: null,
        summary: null, sourceDocumentName: null, rawExtractedText: null,
      };
      state.extractionStatus = "idle";
      state.extractionProgress = 0;
      state.saveStatus = "idle";
    },
    setProgress(state, action) {
      state.extractionProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runExtraction.pending, (state) => {
        state.extractionStatus = "loading";
        state.extractionProgress = 10;
      })
      .addCase(runExtraction.fulfilled, (state, action) => {
        const d = action.payload;
        state.form = { ...state.form, ...d.extracted_fields };
        state.ai = {
          completeness: d.ai_completeness,
          risk: d.ai_risk_classification,
          rootCause: d.ai_root_cause_suggestions,
          capa: d.ai_capa_recommendations,
          summary: d.ai_summary,
          sourceDocumentName: d.source_document_name,
          rawExtractedText: d.raw_extracted_text,
        };
        state.extractionStatus = "succeeded";
        state.extractionProgress = 100;
      })
      .addCase(runExtraction.rejected, (state) => {
        state.extractionStatus = "failed";
        state.extractionProgress = 0;
      })
      .addCase(submitComplaint.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(submitComplaint.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.lastSavedId = action.payload.id;
      })
      .addCase(submitComplaint.rejected, (state) => {
        state.saveStatus = "failed";
      });
  },
});

export const { updateField, resetForm, setProgress } = complaintSlice.actions;
export default complaintSlice.reducer;
