/** Identity established by authentication, independent of the HTTP request. */
export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
}
