const CategoryChips = ({ categories, active, onChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
      <button
        onClick={() => onChange("")}
        className={`rounded-full px-4 py-2 text-xs font-semibold ${
          active === "" ? "bg-primary-500 text-white" : "bg-white text-gray-600"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => onChange(cat.name)}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
            active === cat.name ? "bg-primary-500 text-white" : "bg-white text-gray-600"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
