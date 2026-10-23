import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, getActivitiesByCategory } from '../data/activitiesCatalog';
import { useApp } from '../context/AppContext';
import { speakGreek } from '../utils/soundAndSpeech';

export const ChildHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useApp();

  const handleCategorySelect = (categoryId: string, voicePromptEl: string) => {
    speakGreek(voicePromptEl, settings.voiceEnabled);
    navigate(`/category/${categoryId}`);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-8" data-testid="child-hub-page">
      {/* Welcoming Child Banner */}
      <section
        aria-labelledby="hub-welcome-heading"
        className="bg-sand-light border-2 border-sand-dark rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sage-surface border-2 border-sage flex items-center justify-center text-4xl shrink-0">
            🐨
          </div>
          <div>
            <h1 id="hub-welcome-heading" className="text-2xl md:text-3xl font-extrabold text-charcoal">
              Γεια σου! Τι θέλεις να παίξουμε σήμερα;
            </h1>
            <p className="text-base text-charcoal-muted">
              Διάλεξε μία από τις 4 ήρεμες ομάδες παιχνιδιών.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            speakGreek(
              'Γεια σου! Διάλεξε μία από τις τέσσερις ομάδες παιχνιδιών για να ξεκινήσουμε.',
              true
            )
          }
          data-testid="hub-voice-welcome-btn"
          aria-label="Άκουσε το καλωσόρισμα"
          className="touch-target px-5 py-3 rounded-2xl bg-white border-2 border-sage text-charcoal font-bold flex items-center gap-2 hover:bg-sage-surface shrink-0"
        >
          <span className="text-2xl" aria-hidden="true">🔊</span>
          <span>Άκου</span>
        </button>
      </section>

      {/* Maximum 4 Primary Categories */}
      <section aria-label="Οι 4 Βασικές Κατηγορίες Δραστηριοτήτων">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="category-cards-grid">
          {CATEGORIES.map((category) => {
            const activities = getActivitiesByCategory(category.id);
            return (
              <div
                key={category.id}
                data-testid={`category-card-${category.id}`}
                className={`rounded-3xl border-4 p-6 flex flex-col justify-between gap-5 shadow-sm transition-transform ${category.accentColorClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl select-none" aria-hidden="true">
                      {category.pictogram}
                    </span>
                    <div>
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-1 ${category.badgeBgClass}`}
                      >
                        Ομάδα {category.groupCode} • {activities.length} Παιχνίδια
                      </span>
                      <h2 className="text-2xl font-extrabold text-charcoal">{category.titleEl}</h2>
                      <p className="text-sm font-bold text-charcoal-muted">{category.subtitleEl}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => speakGreek(category.voicePromptEl, true)}
                    aria-label={`Άκουσε περιγραφή για ${category.titleEl}`}
                    className="touch-target px-3.5 py-2 rounded-2xl bg-white/90 border-2 border-charcoal/20 text-charcoal font-bold flex items-center justify-center hover:bg-white"
                  >
                    <span className="text-2xl" aria-hidden="true">🔊</span>
                  </button>
                </div>

                {/* Activity Mini Pictogram Preview */}
                <div className="flex flex-wrap items-center gap-2">
                  {activities.map((act) => (
                    <span
                      key={act.id}
                      className="px-3 py-1.5 rounded-xl bg-white/80 border border-charcoal/15 text-xs font-bold text-charcoal flex items-center gap-1.5"
                    >
                      <span aria-hidden="true">{act.pictogram}</span>
                      <span>{act.titleEl}</span>
                    </span>
                  ))}
                </div>

                {/* Single Clear Primary Action per Category Card */}
                <button
                  type="button"
                  data-testid={`open-category-${category.id}`}
                  onClick={() => handleCategorySelect(category.id, category.voicePromptEl)}
                  className="touch-target w-full py-4 px-6 rounded-2xl bg-charcoal text-white font-extrabold text-lg flex items-center justify-center gap-3 hover:bg-slate-dark transition-colors"
                >
                  <span>Παίξε «{category.titleEl}»</span>
                  <span aria-hidden="true">➡️</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Non-Medical & Privacy-by-Design Footer Disclaimer */}
      <footer
        data-testid="educational-disclaimer-footer"
        className="p-4 rounded-2xl bg-sand-light border border-sand-dark text-center text-xs text-charcoal-muted space-y-1"
      >
        <p className="font-bold text-charcoal">
          Σημαντική Ενημέρωση: Το SynapsePlay (FocusEngine 5+) είναι περιβάλλον παιδαγωγικής
          υποστήριξης και εξάσκησης δεξιοτήτων.
        </p>
        <p>
          ΔΕΝ αποτελεί ιατρική συσκευή, διαγνωστικό εργαλείο ή κλινική θεραπεία ΔΕΠΥ. 100% τοπική
          λειτουργία στη συσκευή χωρίς διαφημίσεις ή ιχνηλάτες.
        </p>
      </footer>
    </main>
  );
};
