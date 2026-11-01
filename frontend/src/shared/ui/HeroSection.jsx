export default function HeroSection({ isDark, user }) {
  return (
    <div className="text-center mb-8 md:mb-12 px-4">
      <h1 className={`text-3xl md:text-5xl font-bold mb-2 ${
        isDark
          ? 'bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent'
      }`}>
        LegalBuddy IT
      </h1>
      
      {user && (
        <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Corporate Legal &amp; Technology Compliance Intelligence
        </p>
      )}
      
      <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${
        isDark ? 'text-slate-300' : 'text-slate-600'
      }`}>
        Upload, analyze, and manage IT corporate documents: Master Services Agreements, SaaS SLAs, DPDP Act 2023, and software IP rights.
      </p>
    </div>
  )
}
