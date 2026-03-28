function StudentCheckbox({ name, checked, onChange, isAdHoc = false }) {
  return (
    <div className="student-row" onClick={() => onChange(!checked)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(!checked)}
        onClick={(e) => e.stopPropagation()}
      />
      <span className={`student-name ${isAdHoc ? 'ad-hoc' : ''}`}>{name}</span>
      {isAdHoc && <span className="ad-hoc-tag">ad-hoc</span>}
    </div>
  );
}

export default StudentCheckbox;
