const StatCard = ({ title, value, hint }) => {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
    </div>
  );
};

export default StatCard;
