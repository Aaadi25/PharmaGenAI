import { useDispatch, useSelector } from "react-redux";
import { Calendar, RotateCcw, Save } from "lucide-react";
import { updateField, resetForm, submitComplaint } from "../store/complaintSlice";

const Field = ({ label, name, type = "text", options, unit }) => {
  const dispatch = useDispatch();
  const value = useSelector((s) => s.complaint.form[name]) || "";
  const filled = value !== "";

  const onChange = (e) =>
    dispatch(updateField({ field: name, value: e.target.value }));

  return (
    <div className={`field ${filled ? "filled" : ""}`}>
      <label>{label}</label>
      {options ? (
        <select value={value} onChange={onChange}>
          <option value="">Awaiting AI extraction...</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea rows={3} value={value} placeholder="Awaiting AI extraction..." onChange={onChange} />
      ) : (
        <div className="input-wrap">
          <input
            type={type}
            value={value}
            placeholder={type === "date" ? undefined : "Awaiting AI extraction..."}
            onChange={onChange}
          />
          {type === "date" && (
            <span className="field-icon"><Calendar size={15} /></span>
          )}
          {unit && <span className="field-unit">{unit}</span>}
        </div>
      )}
    </div>
  );
};

export default function ComplaintForm() {
  const dispatch = useDispatch();
  const risk = useSelector((s) => s.complaint.ai.risk);
  const saveStatus = useSelector((s) => s.complaint.saveStatus);

  return (
    <div className="card">
      <div className="form-header">
        <div>
          <h2>Log Customer Complaint</h2>
          <p>API &amp; FDF Quality Assurance Module</p>
        </div>
        <span className={`badge ${risk ? `risk-${risk.risk}` : ""}`}>
          {risk ? `Risk: ${risk.risk}` : "Pending Triage"}
        </span>
      </div>

      <div className="section-title">1. Origin &amp; Customer Details</div>
      <div className="row2">
        <Field label="Complaint Source" name="complaint_source"
          options={["Email", "Phone", "Portal", "Letter", "In-Person"]} />
        <Field label="Customer Name" name="customer_name" />
      </div>

      <div className="section-title">2. Product &amp; Batch Identification</div>
      <div className="row2">
        <Field label="Product Name" name="product_name" />
        <Field label="Product Strength/Grade" name="product_strength_grade" />
      </div>
      <div className="row2">
        <Field label="Batch/Lot Number" name="batch_lot_number" />
        <Field label="Manufacturing Date" name="manufacturing_date" type="date" />
      </div>
      <div className="row2">
        <Field label="Expiry Date" name="expiry_date" type="date" />
        <Field label="Quantity Affected" name="quantity_affected" type="number" unit="kg" />
      </div>

      <div className="section-title">3. Complaint Details</div>
      <div className="row2">
        <Field label="Complaint Type" name="complaint_type"
          options={["Quality Defect", "Packaging Defect", "Adverse Event", "Delivery/Shipping", "Documentation", "Other"]} />
        <Field label="Complaint Date" name="complaint_date" type="date" />
      </div>
      <Field label="Detailed Complaint Description" name="detailed_description" type="textarea" />

      <div className="section-title">4. Initial Assessment &amp; Priority</div>
      <div className="row2">
        <Field label="Initial Severity" name="initial_severity"
          options={["Critical", "Major", "Minor"]} />
        <Field label="Priority" name="priority" options={["High", "Medium", "Low"]} />
      </div>

      <div className="form-actions">
        <button className="btn-secondary" onClick={() => dispatch(resetForm())}>
          <RotateCcw size={14} /> Reset Form
        </button>
        <button
          className="btn-primary"
          disabled={saveStatus === "loading"}
          onClick={() => dispatch(submitComplaint())}
        >
          <Save size={14} /> {saveStatus === "loading" ? "Saving..." : "Save Complaint"}
        </button>
      </div>
      {saveStatus === "succeeded" && (
        <p style={{ color: "#04785a", fontSize: 12.5, marginTop: 10 }}>
          Complaint saved successfully.
        </p>
      )}
    </div>
  );
}
