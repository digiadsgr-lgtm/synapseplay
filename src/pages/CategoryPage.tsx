import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import type { CategoryId } from '../types/domain';
import { getCategoryById, getActivitiesByCategory } from '../data/activitiesCatalog';
import { speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

export const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { settings } = useApp();

  const category = categoryId ? getCategoryById(categoryId as CategoryId) : undefined;
  if (!category) {
    return <Navigate to="/app" replace />;
  }

  const activities = getActivitiesByCategory(category.id);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6" data-testid={`category-page-${category.id}`}>
      {/* Category Header */}
      <div className="bg-sand-light border-2 border-sand-dark rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/app')}
            data-testid="back-to-hub-btn"
            aria-label="Επιστροφή στην Αρχική"
            className="touch-target px-4 py-2 rounded-2xl bg-white border-2 border-slate text-charcoal font-bold flex items-center gap-2 hover:bg-slate-surface"
          >
            <span aria-hidden="true">⬅️</span>
            <span>Αρχική</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">{category.pictogram}</span>
            <div>
              <h1 className="text-2xl font-extrabold text-charcoal">{category.titleEl}</h1>
              <p className="text-sm text-charcoal-muted">{category.subtitleEl}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => speakGreek(category.voicePromptEl, true)}
          className="touch-target px-4 py-2 rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-bold flex items-center gap-2"
        >
          <span aria-hidden="true">🔊</span>
          <span>Άκου την Ομάδα</span>
        </button>
      </div>

      {/* Activities List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <article
            key={activity.id}
            data-testid={`activity-card-${activity.id}`}
            className="bg-white border-4 border-sand-dark rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-sand font-extrabold text-xs text-charcoal">
                  Δραστηριότητα {activity.code} • ~2 λεπτά ({activity.totalRounds} βήματα)
                </span>
                <button
                  type="button"
                  onClick={() => speakGreek(activity.voicePromptEl, true)}
                  aria-label={`Άκουσε οδηγία για ${activity.titleEl}`}
                  className="touch-target px-3 py-1.5 rounded-xl bg-sand-light border border-sand-dark text-charcoal font-bold"
                >
                  🔊
                </button>
              </div>

              <div className="text-5xl text-center py-2" aria-hidden="true">
                {activity.pictogram}
              </div>

              <h2 className="text-xl font-extrabold text-charcoal text-center">
                {activity.titleEl}
              </h2>
              <p className="text-sm text-charcoal-muted text-center">{activity.subtitleEl}</p>

              {/* Plain-Language Parent Guidance on Activity Card */}
              <div
                data-testid={`activity-parent-benefit-${activity.id}`}
                className="p-2.5 rounded-xl bg-sage-surface/60 border border-sage text-xs text-charcoal leading-relaxed"
              >
                <span className="font-extrabold text-sage-dark">💡 Για τον γονέα: </span>
                <span>{activity.parentGuidanceEl}</span>
              </div>

              {/* Interdisciplinary Badges & Active Age Adaptation */}
              <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                {activity.specialistDisciplines.map((disc) => (
                  <span
                    key={disc}
                    className="px-2 py-0.5 rounded-full bg-sage-surface border border-sage text-[11px] font-bold text-charcoal"
                  >
                    {disc}
                  </span>
                ))}
              </div>

              {activity.ageAdaptationsEl?.[settings.ageBand ?? '6-8'] && (
                <p className="text-xs font-bold text-slate-dark bg-slate-surface/70 p-2.5 rounded-xl text-center">
                  🎯 Ηλικία {settings.ageBand ?? '6-8'}:{' '}
                  {activity.ageAdaptationsEl[settings.ageBand ?? '6-8']}
                </p>
              )}

              {/* Pictogram steps preview */}
              <div className="pt-2 space-y-1.5">
                {activity.cues.map((cue, idx) => (
                  <div
                    key={cue.labelEl}
                    className="px-3 py-1.5 rounded-xl bg-sand-light flex items-center gap-2 text-xs font-bold text-charcoal"
                  >
                    <span aria-hidden="true">{cue.emoji}</span>
                    <span>
                      {idx + 1}. {cue.labelEl}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              data-testid={`launch-activity-${activity.id}`}
              onClick={() => {
                speakGreek(activity.titleEl, settings.voiceEnabled);
                navigate(`/activity/${activity.id}`);
              }}
              className="touch-target w-full py-3.5 px-5 rounded-2xl bg-sage-dark text-white font-extrabold text-lg flex items-center justify-center gap-2 hover:bg-sage transition-colors"
            >
              <span>Ξεκίνα</span>
              <span aria-hidden="true">▶️</span>
            </button>
          </article>
        ))}
      </div>
    </main>
  );
};
