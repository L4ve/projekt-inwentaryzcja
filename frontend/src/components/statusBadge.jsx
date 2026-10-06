function StatusBadge({ status, statusClass }) {
  return (
    <span className={`status ${statusClass}`}>
      <span className="dot"></span> {status} </span>
  );
}

export default StatusBadge;