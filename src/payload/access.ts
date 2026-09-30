import type { Access, CollectionBeforeChangeHook, FieldAccess } from "payload";

export const isEditorialUser = (user: unknown) => {
  if (!user || typeof user !== "object" || !("role" in user)) return false;
  return user.role === "admin" || user.role === "editor";
};

export const isContentAgentUser = (user: unknown) => {
  if (!user || typeof user !== "object" || !("role" in user)) return false;
  return user.role === "content-agent";
};

export const isStrictAdminUser = (user: unknown) => {
  if (!user || typeof user !== "object" || !("collection" in user) || !("role" in user)) return false;
  return user.collection === "users" && user.role === "admin";
};

const isCustomerUser = (user: unknown) => {
  if (!user || typeof user !== "object" || !("collection" in user)) return false;
  return user.collection === "customers";
};

export const isAdmin: Access = ({ req }) => isEditorialUser(req.user);
export const isContentAuthor: Access = ({ req }) => (
  isEditorialUser(req.user) || isContentAgentUser(req.user)
);

export const allowContentAgent = (fallback?: Access): Access => async (args) => {
  if (isContentAgentUser(args.req.user)) return true;
  return fallback ? fallback(args) : false;
};

export const updateUnpublishedContent: Access = ({ req }) => {
  if (isEditorialUser(req.user)) return true;
  if (isContentAgentUser(req.user)) return { published: { equals: false } };
  return false;
};

export const forceContentAgentDraft: CollectionBeforeChangeHook = ({ data, req }) => (
  isContentAgentUser(req.user) ? { ...data, _status: "draft" } : data
);

export const forceContentAgentUnpublished: CollectionBeforeChangeHook = ({ data, req }) => (
  isContentAgentUser(req.user) ? { ...data, published: false } : data
);
export const adminOnlyFieldAccess: FieldAccess = ({ req }) => isEditorialUser(req.user);
export const isAuthenticated: Access = ({ req }) => Boolean(req.user);
export const isCustomer: FieldAccess = ({ req }) => isCustomerUser(req.user);

export const adminOrPublishedStatus: Access = ({ req }) => {
  if (isEditorialUser(req.user)) return true;
  return { _status: { equals: "published" } };
};

export const contentAgentOrPublishedStatus: Access = ({ req }) => {
  if (isEditorialUser(req.user) || isContentAgentUser(req.user)) return true;
  return { _status: { equals: "published" } };
};

export const isDocumentOwner: Access = ({ req }) => {
  if (isEditorialUser(req.user)) return true;
  if (!req.user?.id) return false;
  return { customer: { equals: req.user.id } };
};
