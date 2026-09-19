import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Share2,
  PieChart,
  BarChart3,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Tags,
  Layers,
  Star,
} from 'lucide-react';
import { storage } from '../../services/storage';
import { getAutoTextColor } from '../../services/imageUtils';

interface StatsPageProps {
  folderId: string;
  onBack: () => void;
}

export const StatsPage: React.FC<StatsPageProps> = ({ folderId, onBack }) => {
  const folder = storage.getFolderById(folderId);
  const tiers = storage.getTiers(folderId);
  const entries = storage.getEntries(folderId);
  const tags = storage.getTags(folderId);

  // Analytics
  const totalEntries = entries.length;
  const assignedEntries = entries.filter((e) => e.tierId !== null);
  const poolEntries = entries.filter((e) => e.tierId === null);

  const scoredEntries = entries.filter((e) => e.score !== null && e.score !== undefined);
  const avgScore = scoredEntries.length > 0
    ? (scoredEntries.reduce((acc, curr) => acc + (curr.score || 0), 0) / scoredEntries.length).toFixed(1)
    : null;

  // Distribution per tier
  const tierDistribution = useMemo(() => {
    return tiers.map((tier) => {
      const inTier = entries.filter((e) => e.tierId === tier.id);
      const pct = totalEntries > 0 ? (inTier.length / totalEntries) * 100 : 0;
      return {
        ...tier,
        count: inTier.length,
        percentage: pct,
      };
    });
  }, [tiers, entries, totalEntries]);

  // Top 3 & Bottom 3 by score
  const sortedByScore = useMemo(() => {
    return [...scoredEntries].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [scoredEntries]);

  const top3 = sortedByScore.slice(0, 3);
  const bottom3 = sortedByScore.length >= 4 ? sortedByScore.slice(-3).reverse() : [];

  // Anomaly check
  const analysisFeedback = useMemo(() => {
    if (assignedEntries.length < 5) {
      return {
        type: 'neutral',
        title: 'Data Masih Terlalu Sedikit',
        desc: 'Beri tier pada minimal 5 entri untuk melihat analisis bias distribusi.',
      };
    }

    const firstTierCount = tierDistribution[0]?.count || 0;
    const firstTierRatio = firstTierCount / assignedEntries.length;

    if (firstTierRatio > 0.45) {
      return {
        type: 'warning',
        title: `Terlalu Banyak Entri di Tier ${tierDistribution[0]?.label}`,
        desc: `Sebesar ${Math.round(firstTierRatio * 100)}% entri berada di tier teratas. Pertimbangkan untuk lebih selektif atau tambahkan tier baru.`,
      };
    }

    const emptyTiers = tierDistribution.filter((t) => t.count === 0);
    if (emptyTiers.length > tiers.length / 2) {
      return {
        type: 'warning',
        title: 'Banyak Tier Kosong',
        desc: `Ada ${emptyTiers.length} tier tanpa entri sama sekali. Anda bisa merampingkan preset tier.`,
      };
    }

    return {
      type: 'good',
      title: 'Distribusi Seimbang',
      desc: 'Penyebaran entri di setiap tier cukup proporsional dan objektif.',
    };
  }, [assignedEntries, tierDistribution, tiers]);

  return (
    <div id="stats-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-24 flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 h-16 w-full bg-[#141311]/90 backdrop-blur-md border-b border-[#211F1C] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#D1C4B8] hover:bg-[#211F1C]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-medium text-[#E6E1DC]">Statistik & Analisis</h1>
            <span className="text-xs text-[#9A8F84] truncate block max-w-[200px]">
              {folder?.name}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-5">
        {/* Ringkasan Metrics */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-xl bg-[#211F1C] border border-[#2B2926]">
            <span className="text-xs text-[#9A8F84] block">Total Entri</span>
            <span className="text-2xl font-bold text-[#E6E1DC] mt-1 block">{totalEntries}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#211F1C] border border-[#2B2926]">
            <span className="text-xs text-[#9A8F84] block">Ter-Tier</span>
            <span className="text-2xl font-bold text-[#E0A458] mt-1 block">
              {assignedEntries.length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#211F1C] border border-[#2B2926]">
            <span className="text-xs text-[#9A8F84] block">Di Pool</span>
            <span className="text-2xl font-bold text-[#D1C4B8] mt-1 block">
              {poolEntries.length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#211F1C] border border-[#2B2926]">
            <span className="text-xs text-[#9A8F84] block">Rata-rata Skor</span>
            <span className="text-2xl font-bold text-[#FFC107] mt-1 block">
              {avgScore ? `${avgScore}` : '-'}
            </span>
          </div>
        </section>

        {/* Analisis Distribusi Banner */}
        <section
          className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            analysisFeedback.type === 'good'
              ? 'bg-[#1D3220]/40 border-[#2E5E35] text-[#A6E6AB]'
              : analysisFeedback.type === 'warning'
              ? 'bg-[#4A2800]/40 border-[#8A5100] text-[#FFDDB3]'
              : 'bg-[#211F1C] border-[#2B2926] text-[#D1C4B8]'
          }`}
        >
          {analysisFeedback.type === 'good' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#4CAF50]" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#E0A458]" />
          )}
          <div>
            <h4 className="text-sm font-semibold text-[#E6E1DC]">{analysisFeedback.title}</h4>
            <p className="text-xs mt-1 text-[#D1C4B8] leading-relaxed">
              {analysisFeedback.desc}
            </p>
          </div>
        </section>

        {/* Distribusi Tier Horizontal Bar Chart */}
        <section className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E6E1DC] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#E0A458]" />
              Distribusi Tier
            </h3>
            <span className="text-xs text-[#9A8F84]">{assignedEntries.length} entri terdata</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {tierDistribution.map((t) => {
              const { textColor } = getAutoTextColor(t.colorHex);
              return (
                <div key={t.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded font-bold text-[10px] flex items-center justify-center"
                        style={{ backgroundColor: t.colorHex, color: textColor }}
                      >
                        {t.label.slice(0, 2)}
                      </span>
                      <span className="text-[#E6E1DC] font-medium">Tier {t.label}</span>
                    </div>
                    <span className="text-[#9A8F84]">
                      {t.count} ({Math.round(t.percentage)}%)
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="h-2.5 w-full bg-[#141311] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${t.percentage}%`,
                        backgroundColor: t.colorHex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top 3 & Bottom 3 by Score */}
        {scoredEntries.length >= 3 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Top 3 */}
            <div className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFC107] flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Top 3 Tertinggi
              </h3>
              <div className="space-y-1.5">
                {top3.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-[#2B2926] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-[#FFC107]">#{idx + 1}</span>
                      <span className="text-[#E6E1DC] truncate">{item.title}</span>
                    </div>
                    <span className="font-bold text-[#E0A458] ml-2 shrink-0">
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 3 */}
            {bottom3.length > 0 && (
              <div className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84] flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  3 Terendah
                </h3>
                <div className="space-y-1.5">
                  {bottom3.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-[#2B2926] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#9A8F84]">#{totalEntries - idx}</span>
                        <span className="text-[#E6E1DC] truncate">{item.title}</span>
                      </div>
                      <span className="text-[#9A8F84] ml-2 shrink-0">{item.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tag Breakdown */}
        {tags.length > 0 && (
          <section className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-2.5">
            <h3 className="text-sm font-semibold text-[#E6E1DC] flex items-center gap-2">
              <Tags className="w-4 h-4 text-[#E0A458]" />
              Sebaran Tag
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((tag) => {
                const count = storage.getEntriesByTag(folderId, tag.id).length;
                return (
                  <div
                    key={tag.id}
                    className="px-3 py-1.5 rounded-xl bg-[#2B2926] border border-[#363430] flex items-center gap-2 text-xs"
                  >
                    <span className="text-[#E6E1DC] font-medium">#{tag.name}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#141311] text-[10px] text-[#D1C4B8]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
