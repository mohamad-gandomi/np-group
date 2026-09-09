import type { Access, FieldAccess } from "payload";

const isEditorialUser = (user: unknown) => {
  if (!user || typeof user !== "object" || !("role" in user)) return false;
  return user.role === "admin" || user.role === "editor";
};

export const isAdmin: Access = ({ req }) => isEditorialUser(req.user);
export const adminOnlyFieldAccess: FieldAccess = ({ req }) => isEditorialUser(req.user);
export const isAuthenticated: Access = ({ req }) => Boolean(req.user);
export const isCustomer: FieldAccess = ({ req }) => Boolean(req.user) && !isEditorialUser(req.user);

export const adminOrPublishedStatus: Access = ({ req }) => {
  if (isEditorialUser(req.user)) return true;
  return { _status: { equals: "published" } };
};

export const isDocumentOwner: Access = ({ req }) => {
  if (isEditorialUser(req.user)) return true;
  if (!req.user?.id) return false;
  return { customer: { equals: req.user.id } };
};
