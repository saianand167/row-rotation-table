export default function SeatingCard({ row, code, type, index }) {
  const isGirl = type === 'girl';

  return (
    <div
      className="group relative animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Glow effect */}
      <div
        className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500 ${
          isGirl
            ? 'bg-gradient-to-r from-pink-500 to-violet-500'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
        }`}
      />

      {/* Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1 ${
          isGirl
            ? 'bg-gradient-to-br from-pink-500/10 to-violet-500/10 border-pink-500/20 dark:from-pink-500/5 dark:to-violet-500/5 dark:border-pink-500/10'
            : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 dark:from-blue-500/5 dark:to-cyan-500/5 dark:border-blue-500/10'
        }`}
      >
        {/* Shimmer decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity">
          <div
            className={`w-full h-full rounded-full blur-2xl ${
              isGirl ? 'bg-pink-400' : 'bg-blue-400'
            }`}
            style={{ transform: 'translate(30%, -30%)' }}
          />
        </div>

        <div className="relative p-5 flex items-center gap-4">
          {/* Row number badge */}
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
              isGirl
                ? 'bg-gradient-to-br from-pink-500 to-violet-600 shadow-pink-500/25'
                : 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/25'
            }`}
          >
            {row}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Row {row}
            </p>
            <p
              className={`text-xl font-bold ${
                isGirl
                  ? 'text-pink-600 dark:text-pink-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {code}
            </p>
          </div>

          {/* Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isGirl
                ? 'bg-pink-500/10 text-pink-500 dark:text-pink-400'
                : 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
            }`}
          >
            {isGirl ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5S14.757 2 12 2zM12 14c-4.411 0-8 2.589-8 6v2h16v-2c0-3.411-3.589-6-8-6z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5S14.757 2 12 2zM12 14c-4.411 0-8 2.589-8 6v2h16v-2c0-3.411-3.589-6-8-6z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
