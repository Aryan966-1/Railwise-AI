export const currentUser = {
  id: 1,
  name: "Sumit",
  email: "sumit@example.com",
};

export function getAuthenticatedHeaders() {
  return {
    "X-User-Id": String(currentUser.id),
  };
}
