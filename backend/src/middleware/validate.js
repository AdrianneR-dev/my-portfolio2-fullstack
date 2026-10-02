/**
 * Validates and sanitizes req[part] (default: body) against a Zod schema.
 * On success, replaces req[part] with the parsed (coerced/trimmed) value.
 * On failure, responds 400 with a flat list of field-level issues instead of
 * ever reaching a route handler or the database.
 */
export function validate(schema, part = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return res.status(400).json({
        error: 'ValidationError',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    req[part] = result.data;
    next();
  };
}
