import { useState } from "react";

export default function EditInvoice({ components, onSave }) {
  const [editedComponents, setEditedComponents] = useState(components);

  const handleChange = (field, value) => {
    setEditedComponents({
      ...editedComponents,
      [field]: value,
    });
  };

  const handleSave = () => {
    onSave(editedComponents);
  };

  return (
    <div>
      <h2>Edit Invoice</h2>
      {Object.keys(editedComponents.key_values).map((key) => (
        <div key={key}>
          <label>{key}:</label>
          <input
            type="text"
            value={editedComponents.key_values[key]}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        </div>
      ))}
      {/* Similarly, handle tables and other components */}
      <button onClick={handleSave}>Save Changes</button>
    </div>
  );
}
