function SearchBox({ value, onChange, placeholder = 'Search students...' }) {
  return (
    <input
      className="search-box"
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default SearchBox;
