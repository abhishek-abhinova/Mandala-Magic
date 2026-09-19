function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'Authentication required' });
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === role) return next();
    res.status(403).json({ error: 'Forbidden' });
  };
}

function attachUser(usersRepo) {
  return (req, res, next) => {
    if (req.session && req.session.userId) {
      req.user = usersRepo.findById(req.session.userId);
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, attachUser };