import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Menyimpan info user (id, role) dari token ke request
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Middleware untuk role tertentu (contoh: hanya admin)
export const isAdmin = (req, res, next) => {
  // Izinkan akses jika peran pengguna adalah 'admin' ATAU 'superuser'
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "superuser")
  ) {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Akses ditolak. Hanya untuk Admin atau Super User." });
  }
};
