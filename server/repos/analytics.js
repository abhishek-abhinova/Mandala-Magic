const { query, queryOne, run } = require('../db');

module.exports = {
  trackPageView({ pageType, pageId, url, userAgent, ip, userId }) {
    run('INSERT INTO page_views (page_type,page_id,url,user_agent,ip,user_id) VALUES (?,?,?,?,?,?)', [pageType||'', pageId||'', url||'', userAgent||'', ip||'', userId||null]);
  },
  trackEvent({ eventType, pageType, pageId, data, userId, sessionId }) {
    run('INSERT INTO analytics_events (event_type,page_type,page_id,data,user_id,session_id) VALUES (?,?,?,?,?,?)', [eventType, pageType||'', pageId||'', JSON.stringify(data||{}), userId||null, sessionId||'']);
  },
  totalViews() { return queryOne('SELECT COUNT(*) as n FROM page_views').n; },
  totalEvents() { return queryOne('SELECT COUNT(*) as n FROM analytics_events').n; },
  topPages(limit = 10) { return query('SELECT page_type, page_id, COUNT(*) as views FROM page_views GROUP BY page_type, page_id ORDER BY views DESC LIMIT ?', [limit]); },
  recentEvents(limit = 20) { return query('SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT ?', [limit]); },
  dailyViews(days = 7) {
    return query(`SELECT date(created_at) as day, COUNT(*) as views FROM page_views WHERE created_at >= datetime('now', '-' || ? || ' days') GROUP BY day ORDER BY day`, [days]);
  },
};
