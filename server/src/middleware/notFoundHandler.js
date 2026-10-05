/**
 * 404 handler for every request that no route matched.
 * Renders the error envelope from `.ai/API_CONTRACTS.md` §1.3.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export default function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
    },
  });
}
