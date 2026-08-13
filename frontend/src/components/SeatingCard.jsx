export default function SeatingCard({ row, code, type, index }) {
  const isGirl = type === 'girl';

  return (
    <div
      className="group relative animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Glow highlight on hover */}
      <div
        className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 ${
          isGirl
            ? 'bg-gradient-to-r from-pink-500 to-purple-500'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
        }`}
      />

      {/* Main Seating Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1 shadow-sm ${
          isGirl
            ? 'bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent border-pink-500/20 dark:from-pink-500/10 dark:via-purple-500/5 dark:border-pink-500/20'
            : 'bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border-blue-500/20 dark:from-blue-500/10 dark:via-cyan-500/5 dark:border-blue-500/20'
        }`}
      >
        <div className="relative p-4 sm:p-5 flex items-center justify-between gap-4">
          
          {/* Row Number Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-md ${
                isGirl
                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-pink-500/25'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/25'
              }`}
            >
              R{row}
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Row {row}
              </p>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Table Assignment
              </h4>
            </div>
          </div>

          {/* Seat Code Badge */}
          <div
            className={`px-3.5 py-1.5 rounded-xl font-mono font-extrabold text-lg shadow-xs border ${
              isGirl
                ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
            }`}
          >
            {code}
          </div>

        </div>
      </div>
    </div>
  );
}
