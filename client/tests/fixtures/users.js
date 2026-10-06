// Shared fixtures for frontend component tests (ARCHITECTURE §2).
// Deterministic sample data — never real user data or secrets.
export const sampleUser = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
};

export const sampleAuthResponse = {
  success: true,
  data: {
    user: sampleUser,
    token: 'test-jwt-token',
  },
};
