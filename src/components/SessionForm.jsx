import { useState } from 'react';

function SessionForm({ onCreate, disabled }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName('');
    setDescription('');
  }

  return (
    <form onSubmit={handleSubmit} className="section">
      <div className="form-group">
        <label>Session Name *</label>
        <input
          type="text"
          placeholder="e.g. Apartment_7_to_8am"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Description (optional)</label>
        <input
          type="text"
          placeholder="e.g. Morning batch"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={disabled || !name.trim()}>
        Create Session
      </button>
    </form>
  );
}

export default SessionForm;
