const analyticsRepo = require('../repos/analytics');

// Middleware + helpers to track page views and key events.
function trackPage() {
  return (req, res, next) => {
    try {
      const url = req.path;
      let type = '', id = '';
      const m = url.match(/^\/(artwork|product|collection|shop|gallery|daily)\/([^/]+)/);
      if (url === '/') type = 'home';
      else if (url.startsWith('/shop')) type = 'shop';
      else if (url.startsWith('/gallery')) type = 'gallery';
      else if (url.startsWith('/daily')) type = 'daily';
      else if (m) { type = m[1]; id = decodeURIComponent(m[2]); }
      analyticsRepo.trackPageView({ pageType: type, pageId: id, url, userAgent: req.headers['user-agent'] || '', ip: req.ip, userId: req.session ? req.session.userId : null });
    } catch (e) { /* never block requests on analytics */ }
    next();
  };
}

function event(eventType, pageType, pageId, data) {
  return function (req, res, next) {
    try {
      analyticsRepo.trackEvent({ eventType, pageType, pageId, data, userId: req.session ? req.session.userId : null, sessionId: req.sessionID });
    } catch (e) { /* ignore */ }
    next();
  };
}

module.exports = { trackPage, event };