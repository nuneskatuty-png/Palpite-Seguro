import React, { useState, useMemo, useEffect } from 'react';

// ---------- football-data.org config (via Vercel proxy to avoid CORS + hide key) ----------
const PROXY_BASE = '/api/football';

// Competition codes on football-data.org that map to our local league keys
const API_LEAGUE_CODES = {
  premier: 'PL',
  laliga: 'PD',
  bundesliga: 'BL1',
  seriea: 'SA',
  ligue1: 'FL1',
  champions: 'CL',
  // girabola: no coverage on this API — stays manual
};

async function apiFetch(path) {
  const res = await fetch(`${PROXY_BASE}?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    if (res.status === 429) throw new Error('Limite de pedidos atingido, tenta novamente em breve');
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
}

async function fetchUpcomingFixtures(code) {
  const data = await apiFetch(`/competitions/${code}/matches?status=SCHEDULED`);
  return (data.matches || []).slice(0, 15);
}

async function fetchStandingsTable(code) {
  const data = await apiFetch(`/competitions/${code}/standings`);
  const table = data.standings?.find((s) => s.type === 'TOTAL')?.table || [];
  return table;
}

function buildTeamStatsMap(table) {
  const map = {};
  let totalGoals = 0, totalPlayed = 0;
  table.forEach((row) => {
    const played = row.playedGames || 1;
    map[row.team.id] = {
      name: row.team.name,
      avgFor: row.goalsFor / played,
      avgAgainst: row.goalsAgainst / played,
    };
    totalGoals += row.goalsFor;
    totalPlayed += played;
  });
  const avgGoals = totalPlayed > 0 ? totalGoals / totalPlayed : 1.35;
  return { map, avgGoals };
}

const LEAGUES = {
  premier: {
    name: 'Premier League',
    country: 'Inglaterra',
    avgGoals: 1.45,
    teams: {
      'Manchester City': { att: 1.55, def: 0.72 },
      'Arsenal': { att: 1.42, def: 0.68 },
      'Liverpool': { att: 1.50, def: 0.78 },
      'Chelsea': { att: 1.28, def: 0.85 },
      'Manchester United': { att: 1.15, def: 0.95 },
      'Tottenham': { att: 1.35, def: 1.05 },
      'Newcastle': { att: 1.22, def: 0.88 },
      'Aston Villa': { att: 1.18, def: 0.92 },
    },
  },
  laliga: {
    name: 'La Liga',
    country: 'Espanha',
    avgGoals: 1.35,
    teams: {
      'Real Madrid': { att: 1.60, def: 0.65 },
      'Barcelona': { att: 1.55, def: 0.70 },
      'Atlético Madrid': { att: 1.30, def: 0.68 },
      'Girona': { att: 1.20, def: 0.95 },
      'Athletic Bilbao': { att: 1.15, def: 0.85 },
      'Real Sociedad': { att: 1.10, def: 0.90 },
      'Sevilla': { att: 1.05, def: 1.00 },
      'Villarreal': { att: 1.18, def: 0.98 },
    },
  },
  bundesliga: {
    name: 'Bundesliga',
    country: 'Alemanha',
    avgGoals: 1.55,
    teams: {
      'Bayern München': { att: 1.68, def: 0.70 },
      'Bayer Leverkusen': { att: 1.50, def: 0.72 },
      'Borussia Dortmund': { att: 1.45, def: 0.90 },
      'RB Leipzig': { att: 1.42, def: 0.80 },
      'Eintracht Frankfurt': { att: 1.25, def: 1.00 },
      'VfB Stuttgart': { att: 1.35, def: 0.95 },
    },
  },
  seriea: {
    name: 'Serie A',
    country: 'Itália',
    avgGoals: 1.30,
    teams: {
      'Inter de Milão': { att: 1.50, def: 0.62 },
      'Juventus': { att: 1.25, def: 0.68 },
      'AC Milan': { att: 1.32, def: 0.78 },
      'Napoli': { att: 1.35, def: 0.75 },
      'AS Roma': { att: 1.15, def: 0.85 },
      'Atalanta': { att: 1.40, def: 0.88 },
    },
  },
  ligue1: {
    name: 'Ligue 1',
    country: 'França',
    avgGoals: 1.40,
    teams: {
      'Paris Saint-Germain': { att: 1.70, def: 0.60 },
      'Monaco': { att: 1.35, def: 0.85 },
      'Marseille': { att: 1.25, def: 0.90 },
      'Lille': { att: 1.15, def: 0.80 },
      'Lyon': { att: 1.20, def: 0.95 },
      'Lens': { att: 1.10, def: 0.88 },
    },
  },
  champions: {
    name: 'Liga dos Campeões',
    country: 'Europa',
    avgGoals: 1.50,
    teams: {
      'Real Madrid': { att: 1.62, def: 0.65 },
      'Manchester City': { att: 1.58, def: 0.68 },
      'Bayern München': { att: 1.55, def: 0.70 },
      'Paris Saint-Germain': { att: 1.52, def: 0.72 },
      'Barcelona': { att: 1.50, def: 0.75 },
      'Inter de Milão': { att: 1.40, def: 0.65 },
      'Arsenal': { att: 1.38, def: 0.70 },
      'Liverpool': { att: 1.45, def: 0.78 },
    },
  },
  girabola: {
    name: 'Girabola',
    country: 'Angola',
    avgGoals: 1.15,
    teams: {
      'Petro de Luanda': { att: 1.50, def: 0.65 },
      '1º de Agosto': { att: 1.40, def: 0.70 },
      'Sagrada Esperança': { att: 1.20, def: 0.85 },
      'Interclube': { att: 1.15, def: 0.90 },
      'Kabuscorp': { att: 1.10, def: 0.95 },
      'Recreativo do Libolo': { att: 1.05, def: 1.00 },
      'Desportivo da Huíla': { att: 0.95, def: 1.05 },
      'Bravos do Maquis': { att: 0.90, def: 1.10 },
      'Sporting de Cabinda': { att: 0.92, def: 1.08 },
      'Académica do Lobito': { att: 0.88, def: 1.12 },
    },
  },
};

function poissonPMF(k, lambda) {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}
function factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function predictMatch(league, homeTeam, awayTeam) {
  const home = league.teams[homeTeam];
  const away = league.teams[awayTeam];
  const HOME_ADV = 1.12;

  const lambdaHome = league.avgGoals * home.att * away.def * HOME_ADV;
  const lambdaAway = league.avgGoals * away.att * home.def;

  const MAX_GOALS = 6;
  const matrix = [];
  let pHome = 0, pDraw = 0, pAway = 0;
  let mostLikely = { h: 0, a: 0, p: 0 };

  for (let h = 0; h <= MAX_GOALS; h++) {
    const row = [];
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = poissonPMF(h, lambdaHome) * poissonPMF(a, lambdaAway);
      row.push(p);
      if (p > mostLikely.p) mostLikely = { h, a, p };
      if (h > a) pHome += p;
      else if (h === a) pDraw += p;
      else pAway += p;
    }
    matrix.push(row);
  }

  const total = pHome + pDraw + pAway;
  const over25 = matrix.reduce((sum, row, h) => sum + row.reduce((s, p, a) => s + (h + a > 2.5 ? p : 0), 0), 0);
  const btts = matrix.reduce((sum, row, h) => sum + row.reduce((s, p, a) => s + (h > 0 && a > 0 ? p : 0), 0), 0);

  return {
    lambdaHome, lambdaAway,
    pHome: pHome / total, pDraw: pDraw / total, pAway: pAway / total,
    score: mostLikely,
    over25, btts,
  };
}

const COLORS = {
  navy: '#0A1B3D',
  navyDeep: '#061229',
  gold: '#D4AF37',
  goldSoft: '#E8C766',
  ink: '#F5F3EC',
  muted: '#8A93A8',
};

function ProbBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginBottom: 4, fontFamily: 'Inter, sans-serif', letterSpacing: 0.5, textTransform: 'uppercase' }}>
        <span>{label}</span>
        <span style={{ color: COLORS.ink, fontWeight: 700 }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function PredictionApp() {
  const [leagueKey, setLeagueKey] = useState('girabola');
  const league = LEAGUES[leagueKey];
  const teamNames = Object.keys(league.teams);
  const [homeTeam, setHomeTeam] = useState(teamNames[0]);
  const [awayTeam, setAwayTeam] = useState(teamNames[1]);

  const isLiveLeague = !!API_LEAGUE_CODES[leagueKey];
  const [fixtures, setFixtures] = useState([]);
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleLeagueChange = (key) => {
    setLeagueKey(key);
    const names = Object.keys(LEAGUES[key].teams);
    setHomeTeam(names[0]);
    setAwayTeam(names[1]);
    setFixtures([]);
    setSelectedFixtureId(null);
    setLiveStats(null);
    setApiError(null);
  };

  useEffect(() => {
    if (!isLiveLeague) return;
    let cancelled = false;
    setLoading(true);
    setApiError(null);
    fetchUpcomingFixtures(API_LEAGUE_CODES[leagueKey])
      .then((matches) => {
        if (cancelled) return;
        setFixtures(matches || []);
        if (matches && matches.length) {
          setSelectedFixtureId(matches[0].id);
        } else {
          setApiError('Sem jogos futuros agendados para esta liga de momento.');
        }
      })
      .catch((err) => {
        if (!cancelled) setApiError('Não foi possível carregar jogos reais (' + err.message + '). A usar dados de exemplo.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [leagueKey, isLiveLeague]);

  useEffect(() => {
    if (!isLiveLeague || !selectedFixtureId) return;
    const fx = fixtures.find((f) => f.id === selectedFixtureId);
    if (!fx) return;
    let cancelled = false;
    setLoading(true);
    setApiError(null);
    fetchStandingsTable(API_LEAGUE_CODES[leagueKey])
      .then((table) => {
        if (cancelled) return;
        const { map, avgGoals } = buildTeamStatsMap(table);
        const home = map[fx.homeTeam.id];
        const away = map[fx.awayTeam.id];
        if (!home || !away) {
          setApiError('Estatísticas indisponíveis para uma das equipas. A usar dados de exemplo.');
          return;
        }
        setLiveStats({ home, away, avgGoals, homeName: fx.homeTeam.name, awayName: fx.awayTeam.name });
      })
      .catch((err) => {
        if (!cancelled) setApiError('Não foi possível carregar estatísticas reais (' + err.message + '). A usar dados de exemplo.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [selectedFixtureId, isLiveLeague, leagueKey]);

  const prediction = useMemo(() => {
    if (isLiveLeague && liveStats) {
      const avgGoals = liveStats.avgGoals;
      const homeAtt = liveStats.home.avgFor / avgGoals;
      const homeDef = liveStats.home.avgAgainst / avgGoals;
      const awayAtt = liveStats.away.avgFor / avgGoals;
      const awayDef = liveStats.away.avgAgainst / avgGoals;
      const fakeLeague = { avgGoals, teams: {
        [liveStats.homeName]: { att: homeAtt, def: homeDef },
        [liveStats.awayName]: { att: awayAtt, def: awayDef },
      }};
      return predictMatch(fakeLeague, liveStats.homeName, liveStats.awayName);
    }
    if (homeTeam === awayTeam) return null;
    return predictMatch(league, homeTeam, awayTeam);
  }, [league, homeTeam, awayTeam, isLiveLeague, liveStats]);

  const displayHome = isLiveLeague && liveStats ? liveStats.homeName : homeTeam;
  const displayAway = isLiveLeague && liveStats ? liveStats.awayName : awayTeam;

  const favorite = prediction
    ? (prediction.pHome > prediction.pAway
        ? (prediction.pHome > prediction.pDraw ? 'home' : 'draw')
        : (prediction.pAway > prediction.pDraw ? 'away' : 'draw'))
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at top, ${COLORS.navy} 0%, ${COLORS.navyDeep} 65%)`,
      fontFamily: 'Inter, -apple-system, sans-serif',
      color: COLORS.ink,
      padding: '28px 16px 60px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        select { -webkit-appearance: none; appearance: none; }
      `}</style>

      <div style={{ maxWidth: 460, margin: '0 auto 24px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `2px solid ${COLORS.gold}`, paddingBottom: 10,
        }}>
          <div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 20, letterSpacing: 0.5, color: COLORS.ink }}>
              PALPITÔMETRO
            </div>
            <div style={{ fontSize: 11, color: COLORS.gold, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
              Motor de Previsões · Poisson
            </div>
          </div>
          <div style={{
            fontFamily: 'Archivo Black, sans-serif', fontSize: 11, color: COLORS.navyDeep,
            background: COLORS.gold, padding: '4px 8px', borderRadius: 3, letterSpacing: 1,
          }}>
            LIVE MODEL
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 460, margin: '0 auto 18px', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.entries(LEAGUES).map(([key, l]) => (
          <button
            key={key}
            onClick={() => handleLeagueChange(key)}
            style={{
              flex: '0 0 auto', padding: '8px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700,
              border: `1px solid ${leagueKey === key ? COLORS.gold : 'rgba(255,255,255,0.15)'}`,
              background: leagueKey === key ? COLORS.gold : 'rgba(255,255,255,0.04)',
              color: leagueKey === key ? COLORS.navyDeep : COLORS.muted,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {l.name}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 460, margin: '0 auto 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: COLORS.muted }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isLiveLeague ? '#4ADE80' : COLORS.muted, display: 'inline-block' }} />
        {isLiveLeague ? 'Dados reais via football-data.org' : 'Dados de exemplo (inserção manual)'}
        {loading && ' · a carregar…'}
      </div>
      {apiError && (
        <div style={{ maxWidth: 460, margin: '0 auto 12px', fontSize: 11.5, color: '#F5A5A5', background: 'rgba(245,80,80,0.08)', border: '1px solid rgba(245,80,80,0.25)', borderRadius: 8, padding: '8px 10px' }}>
          {apiError}
        </div>
      )}

      {isLiveLeague ? (
        <div style={{ maxWidth: 460, margin: '0 auto 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Escolhe o jogo (próximas jornadas)
          </div>
          {fixtures.length === 0 && !loading ? (
            <div style={{ fontSize: 12.5, color: COLORS.muted }}>Sem jogos futuros encontrados para esta liga de momento.</div>
          ) : (
            <select
              value={selectedFixtureId || ''}
              onChange={(e) => setSelectedFixtureId(Number(e.target.value))}
              style={selectStyle}
            >
              {fixtures.map((fx) => (
                <option key={fx.id} value={fx.id}>
                  {fx.homeTeam.name} vs {fx.awayTeam.name} — {new Date(fx.utcDate).toLocaleDateString('pt-PT')}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 460, margin: '0 auto 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Casa</div>
              <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} style={selectStyle}>
                {teamNames.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', color: COLORS.gold, fontSize: 14, paddingTop: 14 }}>VS</div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Fora</div>
              <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} style={selectStyle}>
                {teamNames.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {!prediction ? (
        <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', color: COLORS.muted, fontSize: 13, padding: 30 }}>
          Escolhe duas equipas diferentes para gerar a previsão.
        </div>
      ) : (
        <div style={{ maxWidth: 460, margin: '0 auto' }}>
          <div style={{
            background: COLORS.navyDeep, border: `1px solid ${COLORS.gold}`, borderRadius: 14,
            padding: '22px 18px', textAlign: 'center', marginBottom: 18,
            boxShadow: `0 0 0 1px rgba(212,175,55,0.15), 0 20px 40px -20px rgba(212,175,55,0.25)`,
          }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.gold, textTransform: 'uppercase', marginBottom: 12 }}>
              Resultado mais provável
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
              <TeamLabel name={displayHome} align="right" />
              <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 42, letterSpacing: 4, color: COLORS.ink }}>
                {prediction.score.h}<span style={{ color: COLORS.gold, margin: '0 6px' }}>-</span>{prediction.score.a}
              </div>
              <TeamLabel name={displayAway} align="left" />
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 12 }}>
              Probabilidade deste marcador exacto: {(prediction.score.p * 100).toFixed(1)}%
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Probabilidade de resultado (1X2)
            </div>
            <ProbBar label={`Vitória ${shortName(displayHome)}`} value={prediction.pHome} color={favorite === 'home' ? COLORS.gold : '#5B7BA8'} />
            <ProbBar label="Empate" value={prediction.pDraw} color={favorite === 'draw' ? COLORS.gold : '#5B7BA8'} />
            <ProbBar label={`Vitória ${shortName(displayAway)}`} value={prediction.pAway} color={favorite === 'away' ? COLORS.gold : '#5B7BA8'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatCard label="Mais de 2.5 golos" value={`${(prediction.over25 * 100).toFixed(0)}%`} />
            <StatCard label="Ambas marcam" value={`${(prediction.btts * 100).toFixed(0)}%`} />
            <StatCard label={`Golos esperados ${shortName(displayHome)}`} value={prediction.lambdaHome.toFixed(2)} />
            <StatCard label={`Golos esperados ${shortName(displayAway)}`} value={prediction.lambdaAway.toFixed(2)} />
          </div>

          <div style={{ fontSize: 10.5, color: COLORS.muted, textAlign: 'center', marginTop: 18, lineHeight: 1.6, padding: '0 10px' }}>
            Modelo estatístico (Poisson) baseado em força de ataque/defesa. Uso informativo — não constitui garantia de resultado.
          </div>
        </div>
      )}
    </div>
  );
}

function TeamLabel({ name, align }) {
  return (
    <div style={{ flex: 1, textAlign: align, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3 }}>
      {name}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 20, color: COLORS.gold }}>{value}</div>
      <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function shortName(name) {
  return name.length > 14 ? name.split(' ')[0] : name;
}

const selectStyle = {
  width: '100%', padding: '10px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
  background: COLORS.navyDeep, color: COLORS.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
