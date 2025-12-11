import rateLimit from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 100,                 // limit each IP to 100 requests per window
  message: {
    status: 429,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,    
  legacyHeaders: false,    
});
